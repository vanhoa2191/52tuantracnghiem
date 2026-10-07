// Serializable interaction state; rendering is an adapter, grading lives in guest.mjs.
export const QUIZ_THEMES=[
  {name:'Rừng trái tim',sky:0xe5f1ec,ground:0x98c8ac,leaf:0x73ac83},
  {name:'Đảo tri thức',sky:0xe6eefb,ground:0x96c8d0,leaf:0x879cc0},
  {name:'Vườn kết nối',sky:0xf0f1dc,ground:0xbdcc90,leaf:0x8da569},
  {name:'Thành phố ánh sáng',sky:0xffeddb,ground:0xdbc194,leaf:0xbd9c6e},
];
export const quizTheme=week=>QUIZ_THEMES[Math.max(0,Math.min(3,Math.floor((week-1)/13)))];
export function createPortalInput(order,selected){
  const state={selected:selected||null,pending:false,paused:false,focusIndex:0};
  const enabled=()=>!state.selected&&!state.pending&&!state.paused;
  return {state,setPending:value=>state.pending=!!value,setPaused:value=>state.paused=!!value,confirm:key=>{if(order.includes(key)){state.selected=key;state.pending=false;}},preview:key=>{if(enabled()&&order.includes(key)){state.focusIndex=order.indexOf(key);return key;}return null;},choose:key=>enabled()&&order.includes(key)?key:null,key:key=>{if(!enabled())return null;if(['ArrowLeft','ArrowRight'].includes(key)){state.focusIndex=(state.focusIndex+(key==='ArrowRight'?1:order.length-1))%order.length;return {type:'preview',key:order[state.focusIndex]};}if(key==='Enter'||key===' ')return {type:'choose',key:order[state.focusIndex]};if(/^[1-4]$/.test(key))return {type:'choose',key:order[Number(key)-1]};return null;}};
}
