export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export function weekStatus(week, profile, now = Date.now()) {
  if (!week.questions.length) return {kind:'missing'};
  const done = profile.completions[week.id];
  if (done) return {kind:'done', completedAt:done.firstCompletedAt};
  if (week.id === 1) return {kind:'open'};
  const previous = profile.completions[week.id - 1];
  if (!previous) return {kind:'locked'};
  const unlockAt = previous.firstCompletedAt + WEEK_MS;
  return now >= unlockAt ? {kind:'open'} : {kind:'waiting',unlockAt};
}
export function finishWeek(profile, week, answers, now = Date.now()) {
  const status = weekStatus(week, profile, now);
  if (!['open','done'].includes(status.kind)) throw new Error('Tuần này chưa mở.');
  if (week.questions.some(q => !Object.hasOwn(q.options,answers[q.id]))) throw new Error('Con cần trả lời đủ các tình huống.');
  const previous = profile.completions[week.id];
  profile.completions[week.id] = {firstCompletedAt: previous?.firstCompletedAt ?? now, answers:{...answers}};
  delete profile.drafts[week.id];
  return profile.completions[week.id];
}
export function wrongQuestions(profile, weeks) {
  return weeks.flatMap(w => {
    const answers = profile.completions[w.id]?.answers;
    return answers ? w.questions.filter(q=>answers[q.id]!==q.answer).map(q=>({week:w.id,question:q})) : [];
  });
}
export function newProfile(name) {
  return {id:crypto.randomUUID(),name:name.trim().slice(0,30)||'Bạn nhỏ',completions:{},drafts:{},journal:{}};
}
export function optionOrder(profileId, week, question) {
  let seed = 2166136261;
  for (const c of profileId + ':' + week + ':' + question) seed = Math.imul(seed ^ c.charCodeAt(0),16777619) >>> 0;
  const order = ['A','B','C','D'];
  for (let i=3; i>0; i--) {seed = (Math.imul(seed,1664525)+1013904223) >>> 0; const j=seed%(i+1); [order[i],order[j]]=[order[j],order[i]];}
  return order;
}
export function validateBackup(data, weeks, now=Date.now()) {
  if (!data || data.version!==1 || !Array.isArray(data.profiles) || data.profiles.length<1 || data.profiles.length>8) throw new Error('Tệp sao lưu không hợp lệ.');
  const ids=new Set();
  for (const p of data.profiles) {
    if (!p || typeof p.id!=='string' || p.id.length>100 || ids.has(p.id) || typeof p.name!=='string' || !p.name.trim() || p.name.length>30) throw new Error('Hồ sơ trong tệp không hợp lệ.');
    ids.add(p.id);
    if (!p.completions || !p.drafts || !p.journal || Array.isArray(p.completions) || Array.isArray(p.drafts) || Array.isArray(p.journal)) throw new Error('Tiến độ trong tệp không hợp lệ.');
    for (const [key,c] of Object.entries(p.completions)) {
      const w=weeks.find(w=>String(w.id)===key);
      if (!w?.questions.length || !c || !Number.isFinite(c.firstCompletedAt) || c.firstCompletedAt<0 || c.firstCompletedAt>now+60000 || !c.answers) throw new Error('Mốc hoàn thành không hợp lệ.');
      if (w.id>1 && (!p.completions[w.id-1] || c.firstCompletedAt < p.completions[w.id-1].firstCompletedAt+WEEK_MS)) throw new Error('Thứ tự mở tuần không hợp lệ.');
      if (w.questions.some(q=>!Object.hasOwn(q.options,c.answers[q.id]))) throw new Error('Câu trả lời trong tệp không hợp lệ.');
    }
    for (const [key,d] of Object.entries(p.drafts)) {
      const w=weeks.find(w=>String(w.id)===key);
      if (!w?.questions.length || !d?.answers || !Number.isInteger(d.cursor) || d.cursor<0 || d.cursor>=w.questions.length || !['open','done'].includes(weekStatus(w,p,now).kind)) throw new Error('Bài đang làm không hợp lệ.');
      for (const [q,a] of Object.entries(d.answers)) if(!w.questions.find(x=>String(x.id)===q)?.options[a]) throw new Error('Câu trả lời đang làm không hợp lệ.');
    }
    for (const [key,j] of Object.entries(p.journal)) if (!/^([1-9]|[1-4][0-9]|5[0-2])$/.test(key) || !j || typeof j.text!=='string' || j.text.length>1000 || typeof j.done!=='boolean') throw new Error('Nhật ký không hợp lệ.');
  }
  if (!ids.has(data.activeId)) throw new Error('Hồ sơ đang chọn không hợp lệ.');
  return data;
}
