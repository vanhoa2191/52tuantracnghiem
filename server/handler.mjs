const WEEK_MS=604800000;
export const PERIODS=[
  ...Array.from({length:12},(_,i)=>{const quarter=Math.floor(i/3),part=i%3;return {id:'m'+(i+1),label:'Tháng '+(i+1),type:'month',from:quarter*13+[1,5,9][part],to:quarter*13+[4,8,13][part]};}),
  ...Array.from({length:4},(_,i)=>({id:'q'+(i+1),label:'Quý '+(i+1),type:'quarter',from:i*13+1,to:(i+1)*13})),
  {id:'y1',label:'Cả năm',type:'year',from:1,to:52},
];
export function statusFor(week,completions,now) {
  if(completions[week])return {kind:'done',completedAt:completions[week].firstCompletedAt};
  if(week===1)return {kind:'open'};
  if(!completions[week-1])return {kind:'locked'};
  const unlockAt=completions[week-1].firstCompletedAt+WEEK_MS;
  return now>=unlockAt?{kind:'open'}:{kind:'waiting',unlockAt};
}
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const string=(value,max,label)=>{if(typeof value!=='string'||value.length>max)fail(label+' không hợp lệ.');return value.trim();};
export function createHandler({bank,assets={},contentVersion,clock=Date.now}) {
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  const weekData=w=>bank.weeks.find(x=>x.id===w)||fail('Tuần không tồn tại.',404);
  const accepted=q=>q.acceptedAnswers||[q.answer];
  const exposeQuestion=(q,answer)=>({id:q.id,scenario:q.scenario,options:q.options,safety:q.safety,
    ...(answer?{selected:answer.choice,isCorrect:!!answer.is_correct,answer:q.answer,acceptedAnswers:accepted(q),
      sourceAnswer:q.sourceAnswer||q.answer,explanation:q.explanation,sourceExplanation:q.sourceExplanation,
      optionExplanations:q.optionExplanations,validAlternatives:q.validAlternatives||{},discussion:q.discussion}:{}),});
  return {async fetch(request,env) {
    const url=new URL(request.url),path=url.pathname;
    try {
      if(!path.startsWith('/api/')) {
        const asset=assets[path==='/'?'/index.html':path];
        if(!asset)return new Response('Không tìm thấy trang.',{status:404});
        return new Response(asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':'private, max-age=0','X-Content-Type-Options':'nosniff',
          'Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'",'Referrer-Policy':'same-origin'}});
      }
      // The temporary guest experience exposes curriculum only, never family records.
      if(request.method==='GET'&&path==='/api/guest-content')return json({bank,contentVersion,periods:PERIODS,serverNow:clock()});
      if(request.method==='GET'&&path==='/api/time')return json({serverNow:clock()});
      const owner=request.headers.get('oai-authenticated-user-id');
      if(!owner)fail('Vui lòng đăng nhập để lưu tiến độ của gia đình.',401);
      if(!env.DB)fail('Kho dữ liệu chưa sẵn sàng. Vui lòng thử lại sau.',503);
      if(!['GET','POST'].includes(request.method))fail('Phương thức không được hỗ trợ.',405);
      if(request.method==='POST'){
        const origin=request.headers.get('origin');
        if(origin&&origin!==url.origin)fail('Yêu cầu không hợp lệ.',403);
        if(!request.headers.get('content-type')?.startsWith('application/json'))fail('Cần dữ liệu JSON.',415);
      }
      let input;
      if(request.method==='POST'){
        const raw=await request.text();
        if(raw.length>40000)fail('Dữ liệu quá lớn.',413);
        try{input=JSON.parse(raw);}catch{fail('Dữ liệu không hợp lệ.');}
        if(!input||typeof input!=='object'||Array.isArray(input))fail('Dữ liệu không hợp lệ.');
      }
      const db=env.DB,now=clock();
      const owned=async id=>{
        if(typeof id!=='string'||id.length>100)fail('Hồ sơ không hợp lệ.');
        const child=await db.prepare('SELECT * FROM children WHERE id=? AND owner_id=?').bind(id,owner).first();
        if(!child)fail('Không tìm thấy hồ sơ.',404);
        return child;
      };
      const progressFor=async id=>{
        const rows=(await db.prepare('SELECT * FROM week_progress WHERE child_id=? ORDER BY week').bind(id).all()).results;
        return Object.fromEntries(rows.map(r=>[r.week,{firstCompletedAt:r.first_completed_at,firstAttemptId:r.first_attempt_id}]));
      };
      const ownedAttempt=async id=>{
        if(typeof id!=='string'||id.length>100)fail('Bài làm không hợp lệ.');
        const a=await db.prepare('SELECT a.* FROM attempts a JOIN children c ON c.id=a.child_id WHERE a.id=? AND c.owner_id=?').bind(id,owner).first();
        if(!a)fail('Không tìm thấy bài làm.',404);
        return a;
      };
      const attemptView=async a=>{
        const answers=(await db.prepare('SELECT * FROM answers WHERE attempt_id=? ORDER BY question').bind(a.id).all()).results;
        const byId=Object.fromEntries(answers.map(x=>[x.question,x]));
        const order=JSON.parse(a.option_order||'{}');
        return {id:a.id,childId:a.child_id,week:a.week,startedAt:a.started_at,completedAt:a.completed_at,
          cursor:Math.min(answers.length,9),questions:weekData(a.week).questions.map(q=>({...exposeQuestion(q,byId[q.id]),order:order[q.id]}))};
      };
      const reportFor=async(child,period)=>{
        const first=(await db.prepare('SELECT p.week,p.first_completed_at,a.question,a.is_correct FROM week_progress p JOIN answers a ON a.attempt_id=p.first_attempt_id WHERE p.child_id=? AND p.week BETWEEN ? AND ? ORDER BY p.week,a.question').bind(child.id,period.from,period.to).all()).results;
        const attempts=(await db.prepare('SELECT a.id,a.week,a.started_at,a.completed_at,COUNT(s.question) answered,COALESCE(SUM(s.is_correct),0) correct FROM attempts a LEFT JOIN answers s ON s.attempt_id=a.id WHERE a.child_id=? AND a.week BETWEEN ? AND ? GROUP BY a.id ORDER BY a.started_at,a.id').bind(child.id,period.from,period.to).all()).results;
        const complete=attempts.filter(a=>a.completed_at!==null);
        const completeWeeks=new Set(first.map(x=>x.week));
        const latest=new Map();for(const a of complete)latest.set(a.week,a);
        const summary={totalWeeks:period.to-period.from+1,completedWeeks:completeWeeks.size,
          firstAnswered:first.length,firstAppropriate:first.filter(x=>x.is_correct).length,
          latestAnswered:[...latest.values()].reduce((s,a)=>s+a.answered,0),latestAppropriate:[...latest.values()].reduce((s,a)=>s+a.correct,0),
          completedAttempts:complete.length,practiceAttempts:complete.length-completeWeeks.size,
          savedAnswers:attempts.reduce((s,a)=>s+a.answered,0)};
        const review=await db.prepare('SELECT * FROM assessment_revisions WHERE child_id=? AND period=? ORDER BY created_at DESC,rowid DESC LIMIT 1').bind(child.id,period.id).first();
        const journal=(await db.prepare('SELECT week,note,done,updated_at FROM journals WHERE child_id=? AND week BETWEEN ? AND ? ORDER BY week').bind(child.id,period.from,period.to).all()).results;
        return {child:{id:child.id,name:child.name},period,summary,attempts,firstResults:first,journal,
          assessment:review?{id:review.id,ratings:JSON.parse(review.ratings),evidence:JSON.parse(review.evidence),note:review.note,nextStep:review.next_step,snapshot:JSON.parse(review.snapshot),createdAt:review.created_at}:null,
          serverNow:now};
      };
      if(path==='/api/state'&&request.method==='GET'){
        const children=(await db.prepare('SELECT id,name,created_at FROM children WHERE owner_id=? ORDER BY created_at,id').bind(owner).all()).results;
        const profiles=[];
        for(const c of children){
          const completions=await progressFor(c.id);
          const drafts=(await db.prepare('SELECT week,id FROM attempts WHERE child_id=? AND completed_at IS NULL').bind(c.id).all()).results;
          const journals=(await db.prepare('SELECT week,note,done,updated_at FROM journals WHERE child_id=?').bind(c.id).all()).results;
          const latest=(await db.prepare('SELECT a.week,s.question,s.choice,s.is_correct FROM answers s JOIN attempts a ON s.attempt_id=a.id WHERE a.child_id=? AND a.completed_at IS NOT NULL AND a.id=(SELECT a2.id FROM attempts a2 WHERE a2.child_id=a.child_id AND a2.week=a.week AND a2.completed_at IS NOT NULL ORDER BY a2.completed_at DESC,a2.rowid DESC LIMIT 1)').bind(c.id).all()).results;
          for(const a of latest)if(completions[a.week]){completions[a.week].answers??={};completions[a.week].answers[a.question]={choice:a.choice,isCorrect:!!a.is_correct};}
          profiles.push({id:c.id,name:c.name,createdAt:c.created_at,completions,
            drafts:Object.fromEntries(drafts.map(d=>[d.week,d.id])),journal:Object.fromEntries(journals.map(j=>[j.week,{text:j.note,done:!!j.done,updatedAt:j.updated_at}]))});
        }
        return json({profiles,serverNow:now,periods:PERIODS,portraits:bank.portraits,
          weeks:bank.weeks.map(w=>({id:w.id,title:w.title,goal:w.goal,questionCount:w.questions.length})),contentVersion});
      }
      if(path==='/api/profiles'&&request.method==='POST'){
        const name=string(input.name,30,'Tên');if(!name)fail('Vui lòng nhập tên của bé.');
        const id=crypto.randomUUID();
        const r=await db.prepare('INSERT INTO children (id,owner_id,name,created_at) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM children WHERE owner_id=?)<8').bind(id,owner,name,now,owner).run();
        if(!r.meta.changes)fail('Gia đình đã có đủ 8 hồ sơ.');
        return json({id,name},201);
      }
      if(path==='/api/attempts/start'&&request.method==='POST'){
        const c=await owned(input.childId),w=weekData(input.week),progress=await progressFor(c.id);
        if(!['open','done'].includes(statusFor(w.id,progress,now).kind))fail('Tuần này chưa mở. Con có thể xem lại tuần đã làm.',409);
        const id=crypto.randomUUID();
        const order={};for(const q of w.questions){const keys=['A','B','C','D'];for(let i=3;i>0;i--){const random=crypto.getRandomValues(new Uint32Array(1))[0];const j=random%(i+1);[keys[i],keys[j]]=[keys[j],keys[i]];}order[q.id]=keys;}
        await db.prepare('INSERT OR IGNORE INTO attempts (id,child_id,week,content_version,option_order,started_at) VALUES (?,?,?,?,?,?)').bind(id,c.id,w.id,contentVersion,JSON.stringify(order),now).run();
        const draft=await db.prepare('SELECT * FROM attempts WHERE child_id=? AND week=? AND completed_at IS NULL').bind(c.id,w.id).first();
        return json(await attemptView(draft));
      }
      if(path==='/api/attempt'&&request.method==='GET')return json(await attemptView(await ownedAttempt(url.searchParams.get('id'))));
      if(path==='/api/answer'&&request.method==='POST'){
        const a=await ownedAttempt(input.attemptId);
        if(a.completed_at!==null)fail('Bài này đã hoàn thành; con có thể bắt đầu lượt luyện mới.',409);
        if(a.content_version!==contentVersion)fail('Nội dung đã được cập nhật. Vui lòng liên hệ người quản lý để tiếp tục bài đang làm.',409);
        const q=weekData(a.week).questions.find(q=>q.id===input.question);
        if(!q||!Object.hasOwn(q.options,input.choice))fail('Câu trả lời không hợp lệ.');
        const existing=await db.prepare('SELECT * FROM answers WHERE attempt_id=? AND question=?').bind(a.id,q.id).first();
        if(existing){if(existing.choice!==input.choice)fail('Câu này đã được lưu; hãy luyện lại trong lượt mới.',409);return json(exposeQuestion(q,existing));}
        const count=await db.prepare('SELECT COUNT(*) AS count FROM answers WHERE attempt_id=?').bind(a.id).first();
        if(q.id!==count.count+1)fail('Con hãy làm lần lượt các tình huống.',409);
        await db.prepare('INSERT OR IGNORE INTO answers (attempt_id,question,choice,is_correct,answered_at) VALUES (?,?,?,?,?)').bind(a.id,q.id,input.choice,accepted(q).includes(input.choice)?1:0,now).run();
        const saved=await db.prepare('SELECT * FROM answers WHERE attempt_id=? AND question=?').bind(a.id,q.id).first();
        if(saved.choice!==input.choice)fail('Câu trả lời đã được lưu ở thiết bị khác. Vui lòng tải lại bài.',409);
        return json(exposeQuestion(q,saved));
      }
      if(path==='/api/complete'&&request.method==='POST'){
        const a=await ownedAttempt(input.attemptId);
        const count=await db.prepare('SELECT COUNT(*) AS count FROM answers WHERE attempt_id=?').bind(a.id).first();
        if(count.count!==weekData(a.week).questions.length)fail('Con hãy trả lời đủ 10 tình huống trước khi hoàn thành.',409);
        const progress=await progressFor(a.child_id);
        if(!['open','done'].includes(statusFor(a.week,progress,now).kind))fail('Tuần này chưa mở.',409);
        await db.batch([
          db.prepare('UPDATE attempts SET completed_at=? WHERE id=? AND completed_at IS NULL').bind(now,a.id),
          db.prepare('INSERT OR IGNORE INTO week_progress (child_id,week,first_attempt_id,first_completed_at) SELECT child_id,week,id,completed_at FROM attempts WHERE id=? AND completed_at IS NOT NULL').bind(a.id),
        ]);
        const p=(await progressFor(a.child_id))[a.week];
        return json({week:a.week,firstCompletedAt:p.firstCompletedAt,nextUnlockAt:a.week<52?p.firstCompletedAt+WEEK_MS:null,serverNow:now});
      }
      if(path==='/api/journal'&&request.method==='POST'){
        const c=await owned(input.childId),w=weekData(input.week),progress=await progressFor(c.id);
        if(!['open','done'].includes(statusFor(w.id,progress,now).kind))fail('Tuần này chưa mở.',409);
        const note=string(input.note,1000,'Ghi chú');if(typeof input.done!=='boolean')fail('Trạng thái chưa hợp lệ.');
        await db.prepare('INSERT INTO journals (child_id,week,note,done,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(child_id,week) DO UPDATE SET note=excluded.note,done=excluded.done,updated_at=excluded.updated_at').bind(c.id,w.id,note,input.done?1:0,now).run();
        return json({saved:true,updatedAt:now});
      }
      if(path==='/api/report'&&request.method==='GET'){
        const c=await owned(url.searchParams.get('childId')),p=PERIODS.find(p=>p.id===url.searchParams.get('period'));
        if(!p)fail('Kỳ đánh giá không hợp lệ.');return json(await reportFor(c,p));
      }
      if(path==='/api/assessment'&&request.method==='POST'){
        const c=await owned(input.childId),p=PERIODS.find(p=>p.id===input.period);
        if(!p)fail('Kỳ đánh giá không hợp lệ.');
        if(!input.ratings||!input.evidence||typeof input.ratings!=='object'||typeof input.evidence!=='object'||Array.isArray(input.ratings)||Array.isArray(input.evidence))fail('Bảng đánh giá không hợp lệ.');
        const ratings={},evidence={};
        for(const portrait of bank.portraits){const key=portrait.id;const rating=input.ratings[key]??0;
          if(!Number.isInteger(rating)||rating<0||rating>3)fail('Mức đánh giá không hợp lệ.');
          ratings[key]=rating;evidence[key]=string(input.evidence[key]??'',500,'Minh chứng');}
        const note=string(input.note??'',4000,'Lời ghi nhận'),nextStep=string(input.nextStep??'',1000,'Bước tiếp theo');
        const report=await reportFor(c,p),id=string(input.requestId,100,'Mã lần lưu');if(!/^[a-zA-Z0-9-]{10,100}$/.test(id))fail('Mã lần lưu không hợp lệ.');
        const existing=await db.prepare('SELECT child_id,period FROM assessment_revisions WHERE id=?').bind(id).first();
        if(existing&&(existing.child_id!==c.id||existing.period!==p.id))fail('Mã lần lưu không hợp lệ.',409);
        await db.prepare('INSERT OR IGNORE INTO assessment_revisions (id,child_id,period,ratings,evidence,note,next_step,snapshot,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,c.id,p.id,JSON.stringify(ratings),JSON.stringify(evidence),note,nextStep,JSON.stringify(report.summary),now).run();
        return json({saved:true,id,createdAt:now});
      }
      if(path==='/api/library'&&request.method==='GET')return json({guide:bank.guide,sourceText:bank.sourceText,yearSummary:bank.yearSummary,audit:bank.audit});
      if(path==='/api/export'&&request.method==='GET'){
        const child=await owned(url.searchParams.get('childId'));
        const attempts=(await db.prepare('SELECT * FROM attempts WHERE child_id=? ORDER BY started_at,id').bind(child.id).all()).results;
        const answers=(await db.prepare('SELECT s.* FROM answers s JOIN attempts a ON a.id=s.attempt_id WHERE a.child_id=? ORDER BY s.answered_at').bind(child.id).all()).results;
        const assessments=(await db.prepare('SELECT * FROM assessment_revisions WHERE child_id=? ORDER BY created_at').bind(child.id).all()).results;
        const journal=(await db.prepare('SELECT * FROM journals WHERE child_id=? ORDER BY week').bind(child.id).all()).results;
        return json({version:1,exportedAt:now,contentVersion,child:{id:child.id,name:child.name,createdAt:child.created_at},progress:await progressFor(child.id),attempts,answers,assessments,journal});
      }
      fail('Không tìm thấy chức năng.',404);
    } catch(error) {
      return json({error:error.status?error.message:'Chưa thể lưu hoặc đọc dữ liệu. Vui lòng thử lại; tiến độ đã lưu trên máy chủ vẫn được giữ.'},error.status||503);
    }
  }};
}
