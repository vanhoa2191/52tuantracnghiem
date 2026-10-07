import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {createHandler,PERIODS} from '../server/handler.mjs';
const bank=JSON.parse(readFileSync(new URL('../data/content.json',import.meta.url),'utf8'));
class LocalD1 {
  constructor(){this.db=new DatabaseSync(':memory:');this.db.exec('PRAGMA foreign_keys=ON');for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())this.db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));}
  prepare(sql){const db=this.db;return {values:[],bind(...values){this.values=values;return this;},async first(){return db.prepare(sql).get(...this.values)||null;},async all(){return {results:db.prepare(sql).all(...this.values)};},async run(){const r=db.prepare(sql).run(...this.values);return {success:true,meta:{changes:Number(r.changes)}};}};}
  async batch(statements){this.db.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());this.db.exec('COMMIT');return r;}catch(e){this.db.exec('ROLLBACK');throw e;}}
}
function fixture(){let time=Date.UTC(2026,9,7);const DB=new LocalD1();const handler=createHandler({bank,assets:{'/index.html':{body:'hello',type:'text/html'}},contentVersion:'test-v1',clock:()=>time});return {DB,advance(ms){time+=ms;},now:()=>time,async api(path,body,owner='family-a',headers={}){const response=await handler.fetch(new Request('https://test.site'+path,{method:body?'POST':'GET',headers:{...(owner?{'oai-authenticated-user-id':owner}:{}),...(body?{'Content-Type':'application/json','Origin':'https://test.site'}:{}),...headers},body:body?JSON.stringify(body):undefined}),{DB});return {status:response.status,data:await response.json()};}};}
async function child(f,name='Bé An',owner='family-a'){const r=await f.api('/api/profiles',{name},owner);assert.equal(r.status,201);return r.data.id;}
async function begin(f,childId,week,owner){const r=await f.api('/api/attempts/start',{childId,week},owner);assert.equal(r.status,200,JSON.stringify(r.data));return r.data;}
async function answerAll(f,attempt,wrong=false){const w=bank.weeks[attempt.week-1];for(const q of w.questions){const choice=wrong?Object.keys(q.options).find(k=>!q.acceptedAnswers.includes(k))||q.answer:q.answer;const r=await f.api('/api/answer',{attemptId:attempt.id,question:q.id,choice});assert.equal(r.status,200,JSON.stringify(r.data));}const result=await f.api('/api/complete',{attemptId:attempt.id,completedAt:1});assert.equal(result.status,200,JSON.stringify(result.data));return result.data;}
test('complete source bank, correct editorial alternatives and 16 portraits',()=>{
  assert.equal(bank.weeks.length,52);assert.equal(bank.weeks.reduce((s,w)=>s+w.questions.length,0),520);assert.equal(bank.portraits.length,16);
  assert.equal(bank.weeks[49].questions[2].answer,'A');assert.equal(bank.weeks[49].questions[2].sourceAnswer,'B');
  assert.ok(bank.weeks[48].questions[8].acceptedAnswers.includes('C'));
  for(const w of bank.weeks)for(const q of w.questions){assert.deepEqual(Object.keys(q.options).sort(),['A','B','C','D']);for(const key of q.acceptedAnswers)assert.ok(q.options[key]);}
  assert.ok(bank.sourceText.includes('TẬP 2'));assert.ok(bank.yearSummary.includes('16 Chân Dung'));
});
test('authentication, family isolation, forged profile timestamps and cross-origin writes',async()=>{
  const f=fixture();assert.equal((await f.api('/api/state',null,null)).status,401);
  const id=await child(f);assert.equal((await f.api('/api/report?childId='+id+'&period=y1',null,'family-b')).status,404);
  assert.equal((await f.api('/api/attempts/start',{childId:id,week:1},'family-b')).status,404);
  assert.equal((await f.api('/api/profiles',{name:'hack'},'family-a',{Origin:'https://evil.example'})).status,403);
  const a=await begin(f,id,1);assert.equal((await f.api('/api/answer',{attemptId:a.id,question:1,choice:'C'},'family-b')).status,404);
  assert.equal((await f.api('/api/attempt?id='+a.id,null,'family-b')).status,404);
  assert.equal((await f.api('/api/export?childId='+id,null,'family-b')).status,404);
  const b=await child(f,'Bé Bình');assert.equal((await f.api('/api/state')).data.profiles.find(p=>p.id===b).completions[1],undefined);
});
test('server clock gates exact seven-day boundary; reattempt preserves first completion',async()=>{
  const f=fixture(),id=await child(f);assert.equal((await f.api('/api/attempts/start',{childId:id,week:2})).status,409);
  const a=await begin(f,id,1);assert.equal((await f.api('/api/complete',{attemptId:a.id})).status,409);
  const first=await answerAll(f,a,true);assert.equal(first.firstCompletedAt,f.now());
  assert.equal((await f.api('/api/complete',{attemptId:a.id})).data.firstCompletedAt,first.firstCompletedAt);
  f.advance(1000);const retry=await begin(f,id,1);assert.notEqual(retry.id,a.id);assert.equal((await answerAll(f,retry)).firstCompletedAt,first.firstCompletedAt);
  f.advance(604800000-1001);assert.equal((await f.api('/api/attempts/start',{childId:id,week:2,now:Date.now()+1e12})).status,409);
  f.advance(1);const next=await begin(f,id,2);assert.equal(next.week,2);
  const report=(await f.api('/api/report?childId='+id+'&period=m1')).data;
  assert.equal(report.summary.completedWeeks,1);assert.equal(report.summary.practiceAttempts,1);assert.equal(report.summary.firstAnswered,10);assert.equal(report.summary.latestAppropriate,10);
  assert.ok(report.summary.firstAppropriate<report.summary.latestAppropriate);
});
test('answers persist, reveal feedback only after answering, strict order, repeat requests and option order',async()=>{
  const f=fixture(),id=await child(f),a=await begin(f,id,1);
  assert.equal(a.questions[0].answer,undefined);assert.deepEqual([...a.questions[0].order].sort(),['A','B','C','D']);
  const resumed=await begin(f,id,1);assert.equal(resumed.id,a.id);assert.deepEqual(resumed.questions[0].order,a.questions[0].order);
  assert.equal((await f.api('/api/answer',{attemptId:a.id,question:2,choice:'B'})).status,409);
  assert.equal((await f.api('/api/answer',{attemptId:a.id,question:1,choice:'X'})).status,400);
  const r=await f.api('/api/answer',{attemptId:a.id,question:1,choice:'A'});assert.equal(r.status,200);assert.equal(r.data.answer,'C');assert.ok(r.data.optionExplanations.A);
  assert.equal((await f.api('/api/answer',{attemptId:a.id,question:1,choice:'A'})).status,200);
  assert.equal((await f.api('/api/answer',{attemptId:a.id,question:1,choice:'C'})).status,409);
  const view=(await f.api('/api/attempt?id='+a.id)).data;assert.equal(view.cursor,1);assert.equal(view.questions[0].selected,'A');assert.equal(view.questions[1].answer,undefined);assert.deepEqual(view.questions[0].order,a.questions[0].order);
  const exported=(await f.api('/api/export?childId='+id)).data;assert.equal(exported.answers.length,1);assert.equal(exported.answers[0].choice,'A');assert.ok(exported.attempts[0].option_order);
});
test('monthly quarterly annual assessments keep revision history and no automatic trait ratings',async()=>{
  const f=fixture(),id=await child(f);
  assert.equal(PERIODS.length,17);const months=PERIODS.filter(p=>p.type==='month');assert.deepEqual(months.flatMap(p=>Array.from({length:p.to-p.from+1},(_,i)=>p.from+i)),Array.from({length:52},(_,i)=>i+1));
  for(const period of ['m1','q1','y1']){
    const initial=(await f.api('/api/report?childId='+id+'&period='+period)).data;assert.equal(initial.assessment,null);assert.equal(initial.summary.firstAnswered,0);
    const body={childId:id,period,ratings:{1:2},evidence:{1:'Con chủ động chào bạn.'},note:'Ghi nhận nỗ lực',nextStep:'Cùng đọc sách',requestId:crypto.randomUUID()};
    assert.equal((await f.api('/api/assessment',body)).status,200);assert.equal((await f.api('/api/assessment',body)).status,200);
    f.advance(100);assert.equal((await f.api('/api/assessment',{...body,ratings:{1:3},requestId:crypto.randomUUID()})).status,200);
    const after=(await f.api('/api/report?childId='+id+'&period='+period)).data;
    assert.equal(after.assessment.ratings[1],3);assert.equal(after.assessment.ratings[2],0);assert.equal(after.assessment.snapshot.firstAnswered,0);
    assert.equal((await f.api('/api/assessment',{...body,ratings:{1:99},requestId:crypto.randomUUID()})).status,400);
  }
  const exported=(await f.api('/api/export?childId='+id)).data;assert.equal(exported.assessments.length,6);
});
test('entire 52-week journey, durable quiz history, yearly total and journals',async()=>{
  const f=fixture(),id=await child(f);
  for(let w=1;w<=52;w++){if(w>1)f.advance(604800000);await answerAll(f,await begin(f,id,w));}
  const report=(await f.api('/api/report?childId='+id+'&period=y1')).data;assert.equal(report.summary.completedWeeks,52);assert.equal(report.summary.firstAnswered,520);assert.equal(report.summary.firstAppropriate,520);
  assert.equal((await f.api('/api/journal',{childId:id,week:52,note:'Con đã giúp bạn.',done:true})).status,200);
  const exportData=(await f.api('/api/export?childId='+id)).data;assert.equal(exportData.answers.length,520);assert.equal(exportData.attempts.length,52);assert.equal(exportData.journal.length,1);assert.equal(Object.keys(exportData.progress).length,52);
  assert.equal((await f.api('/api/answer',{attemptId:exportData.attempts[0].id,question:1,choice:'C'})).status,409);
});
