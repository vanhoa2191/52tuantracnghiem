export const WORLDS=[['🌳','Rừng trái tim'],['📖','Đảo tri thức'],['🌻','Vườn kết nối'],['🏰','Thành phố ánh sáng']];
export function worldMarkup({name,completed,selected,weekOptions,escape}){
  return `<div class="world-heading"><div><div class="eyebrow">MẦM SÁNG · CUỘC PHIÊU LƯU 3D</div><h1>52 đảo nhỏ, một thế giới lớn</h1><p>Chạm một đảo để bay tới. Mỗi nhiệm vụ hoàn thành sẽ đánh thức một cây xanh.</p></div><button class="secondary" data-action="week-list">▦ Danh sách nhiệm vụ</button></div>
  <section class="world-shell" aria-label="Trò chơi khám phá 52 tuần">
    <div class="world-canvas" id="world-canvas"><div class="world-loading"><span>🌱</span> Đang đánh thức thế giới của con…</div></div>
    <div class="world-top"><div class="world-id"><span>✦</span><div><strong>${escape(name)}</strong><small>${completed} / 52 cây đã thức giấc</small></div></div><button class="world-camera-button" data-action="world-overview" aria-label="Xem toàn bộ 52 đảo">⊞ <span>Toàn cảnh</span></button></div>
    <nav class="biome-tabs" aria-label="Bốn vùng của thế giới">${WORLDS.map((w,i)=>`<button data-action="world-quarter" data-quarter="${i}" aria-label="Quý ${i+1}: ${w[1]}"><span>${w[0]}</span><strong>Quý ${i+1}</strong><small>${w[1]}</small></button>`).join('')}</nav>
    <div class="world-help">Kéo để nhìn quanh · Cuộn hoặc chụm để phóng to<br><kbd>←</kbd> <kbd>→</kbd> chọn đảo · <kbd>Enter</kbd> vào nhiệm vụ</div>
    <div class="spark-card"><span class="spark-icon">✦</span><div><strong>Đốm sáng khám phá</strong><p><span data-spark-count>0</span> / 3 · Trò chơi tự do</p></div><button data-action="world-spark" title="Nhặt đốm sáng tiếp theo" aria-label="Nhặt đốm sáng tiếp theo">＋</button></div>
    <div class="world-dock"><div class="world-picker"><label for="world-week-select">ĐẢO ĐANG KHÁM PHÁ</label><div><button data-action="world-step" data-direction="-1" aria-label="Chọn đảo trước">‹</button><select id="world-week-select" aria-label="Chọn một trong 52 đảo">${weekOptions}</select><button data-action="world-step" data-direction="1" aria-label="Chọn đảo sau">›</button></div></div><div id="world-detail" aria-live="polite"></div></div>
    <div class="world-credit">Một chút tò mò. Một hành động tốt đẹp. ♡</div>
  </section><p class="content-note">ⓘ Không cần đăng nhập. Tiến độ và đánh giá vẫn lưu trên trình duyệt này; có thể tải bản sao lưu trong “Cùng cha mẹ”.</p>`;
}
