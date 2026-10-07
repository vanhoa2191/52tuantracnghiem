export const DESTINATIONS=[
  {id:'home',icon:'⌂',label:'Làng Mầm Sáng'},
  {id:'world',icon:'✦',label:'52 đảo nhiệm vụ'},
  {id:'badges',icon:'❀',label:'Vườn kỷ niệm'},
  {id:'practice',icon:'↻',label:'Sân luyện tập'},
  {id:'parents',icon:'▣',label:'Nhà đồng hành'},
  {id:'reports',icon:'◉',label:'Đài quan sát'},
];
export const SCENE_PAGES={
  welcome:{title:'Một thế giới chờ con khám phá',place:'Làng Mầm Sáng',hint:'Chạm một ngôi nhà để khám phá thế giới. Tạo khu vườn để bắt đầu hành trình của con.'},
  home:{title:'Chào mừng con về làng!',place:'Làng Mầm Sáng',hint:'Ngôi nhà, khu vườn, thư viện và đài quan sát đều là những nơi con có thể ghé thăm.'},
  badges:{title:'Những hạt mầm đã lớn lên',place:'Vườn kỷ niệm',hint:'Khu vườn lớn lên theo các tuần con đã hoàn thành. Mỗi bước nhỏ đều đáng quý.'},
  practice:{title:'Mỗi lần thử, một điều mới',place:'Sân luyện tập',hint:'Ghé lại những câu chuyện con còn phân vân. Mình cùng nghĩ thêm nhé.'},
  parents:{title:'Cùng nhau nuôi dưỡng khu vườn',place:'Nhà đồng hành',hint:'Một nơi để cả nhà đọc tài liệu, giữ kỷ niệm và chăm sóc hành trình của con.'},
  reports:{title:'Nhìn lại những bước con đã đi',place:'Đài quan sát',hint:'Cùng nhìn lại tháng, quý và năm; ghi nhận những điều đã quan sát trong cuộc sống.'},
  journal:{title:'Một điều tốt đẹp hôm nay',place:'Suối kỷ niệm',hint:'Kể lại một trải nghiệm nhỏ. Điều con đã thử chính là một hạt mầm.'},
  celebrate:{title:'Một chặng nhỏ vừa nở hoa!',place:'Cây ánh sáng',hint:'Cảm ơn con đã dành thời gian suy nghĩ và chia sẻ. Khu vườn vừa có thêm một kỷ niệm.'},
};
export const viewKind=route=>['world','journey','map'].includes(route)?'world':route==='quiz'?'quiz':'atrium';
export function scenePage({view,content,name='',completed=0,escape}){
 const p=Object.hasOwn(SCENE_PAGES,view)?SCENE_PAGES[view]:SCENE_PAGES.home;
 return `<section class="scene-layout" data-scene-view="${escape(view)}"><div class="atrium-sticky"><div class="atrium-heading"><span class="eyebrow">MẦM SÁNG · ${escape(p.place).toUpperCase()}</span><h1>${escape(p.title)}</h1><p>${escape(p.hint)}</p></div><div class="atrium-shell"><div id="atrium-canvas" class="atrium-canvas" aria-label="${escape(p.place)}"><div class="world-loading">🌱 Đang mở ${escape(p.place.toLowerCase())}…</div></div><div class="atrium-status"><span>🌱 ${name?escape(name):'Người bạn nhỏ'} · ${completed}/52 cây</span><button class="text-button" data-action="game-settings" aria-haspopup="dialog">⚙</button></div></div><nav class="landmark-links" aria-label="Ghé một địa điểm">${DESTINATIONS.filter(d=>d.id!==view).map(d=>`<a href="#${d.id}" title="${d.label}"><span aria-hidden="true">${d.icon}</span>${d.label}</a>`).join('')}</nav><p class="atrium-controls">Chạm địa điểm · ← → chọn · Enter ghé thăm</p></div><div class="scene-ledger">${content}</div></section>`;
}
export function welcomeContent(){return `<section class="welcome-scroll"><span class="chip gold">52 TUẦN · 520 CÂU CHUYỆN</span><h2>Con là người chăm vườn nhỏ</h2><p>Mỗi tuần, cùng Mầm Nhỏ ghé một đảo, khám phá 10 câu chuyện và gieo một điều tốt đẹp.</p><div class="welcome-steps"><span>✦ Ghé đảo</span><span>❀ Chọn cổng</span><span>🌱 Trồng cây</span></div><button class="primary" data-action="add-profile">Tạo khu vườn của bé →</button><p class="welcome-storage">Không cần đăng nhập. Tiến độ lưu trên trình duyệt này.</p></section><section class="panel"><h2>Mang theo khu vườn của con</h2><p>Đã có bản sao lưu? Khôi phục để tiếp tục hành trình trên thiết bị này.</p><button class="secondary" data-action="import">↑ Khôi phục bản sao lưu</button></section>`;}
