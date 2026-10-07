// Presentation reads progress; it never changes grading or the unlock clock.
const STAGES=[
  {id:'gates',name:'Cổng ánh sáng',guide:'Chạm một cổng'},
  {id:'lanterns',name:'Vườn đèn lồng',guide:'Chạm một đèn lồng'},
  {id:'balloons',name:'Bến khinh khí cầu',guide:'Chạm một khinh khí cầu'},
  {id:'stones',name:'Vườn đá kể chuyện',guide:'Chạm một bệ đá'},
];
export function stageForWeek(week){const n=Math.max(1,Math.min(52,Math.floor(Number(week)||1)));return STAGES[(n-1)%4];}
export function growthForProgress(answered,total=10){return Number.isFinite(answered)&&Number.isFinite(total)&&total>0?Math.max(0,Math.min(1,answered/total)):0;}
export function growthMarkup(answered,total=10){const progress=growthForProgress(answered,total),count=Math.round(progress*total);return `<div id="sprout-progress" class="sprout-progress" role="progressbar" aria-label="Hạt mầm tuần này" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${count}"><span aria-hidden="true">${progress===1?'🌸':progress>=.5?'🌿':'🌱'}</span><div><strong>Hạt mầm của con · ${count}/${total}</strong><div class="sprout-track"><span style="width:${progress*100}%"></span></div></div><small>Mỗi câu chuyện giúp cây lớn thêm</small></div>`;}
export function milestoneForWeek(week){return [13,26,39,52].includes(week)?{quarter:week/13,annual:week===52}:null;}
