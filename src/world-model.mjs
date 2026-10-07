export const BIOMES=[
  {name:'Rừng trái tim',tag:'Nội tâm & phẩm chất',center:[-18,-17],grass:0xa6d37c,rock:0xc39d80,leaf:0x5ca783,accent:0xffd480},
  {name:'Đảo tri thức',tag:'Trí tuệ & tự học',center:[18,-17],grass:0x91cbcf,rock:0xa69bd0,leaf:0x609fa7,accent:0xcbb4ff},
  {name:'Vườn kết nối',tag:'Thể chất & mối quan hệ',center:[18,18],grass:0xc0cc83,rock:0xd3a489,leaf:0x88a865,accent:0xffaf91},
  {name:'Thành phố ánh sáng',tag:'Tầm nhìn & lãnh đạo bản thân',center:[-18,18],grass:0xe2c48a,rock:0xb3a0c4,leaf:0xbaa45b,accent:0xffdd89},
];
export function islandPosition(week){
  if(!Number.isInteger(week)||week<1||week>52)throw new Error('Invalid week');
  const quarter=Math.floor((week-1)/13),i=(week-1)%13,angle=i/13*Math.PI*2-Math.PI*.8;
  const [cx,cz]=BIOMES[quarter].center;
  return [cx+Math.cos(angle)*10.3,0.5+Math.sin(i*1.7)*.45,cz+Math.sin(angle)*10.3];
}
export const canVisit=kind=>kind==='open'||kind==='done';
export function adjacentWeek(selected,direction){return Math.max(1,Math.min(52,selected+direction));}
export function worldNodes(weeks,getStatus){return weeks.map(w=>({week:w.id,quarter:Math.floor((w.id-1)/13),position:islandPosition(w.id),status:getStatus(w).kind}));}
