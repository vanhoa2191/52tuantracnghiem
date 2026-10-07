# Mầm Sáng · 52 tuần

52 bộ tình huống (520 câu), 16 chân dung trong bảng tự đánh giá, bản tổng kết năm và tài liệu nguyên văn.

## Toàn bộ giao diện 3D

Mọi trang đều có cảnh Three.js thực: `src/atrium.mjs` dựng làng nổi, vườn huy hiệu, sân luyện tập, thư viện phụ huynh, đài quan sát báo cáo, suối nhật ký và cây vinh danh. Các địa điểm có thể chạm hoặc chọn bằng bàn phím. `src/world.mjs` dựng 52 đảo nhiệm vụ; `src/quiz.mjs` dựng bốn cổng đáp án. `#map` và `#journey` là các lối vào cùng thế giới 3D. Danh sách tuần mở trong hộp thoại để chọn theo quý, kể cả khi thiết bị không hỗ trợ WebGL.

`public/scene-ui.mjs` quản lý địa điểm và giao diện; `public/village.css` thống nhất bề mặt, điều hướng và biểu mẫu. Chữ, câu hỏi, lời giải và đánh giá vẫn dùng DOM để dễ đọc và thao tác. Màn hình chào có cảnh 3D trước khi tạo hồ sơ. Nội dung dài có cảnh làng bên trái trên máy tính và bố cục dọc trên điện thoại.

Chỉ một renderer hoạt động trong mỗi trang. Three.js được đóng gói trong artifact, không tải từ CDN. Cảnh dùng geometry được gom theo material, giới hạn DPR, hỗ trợ giảm chuyển động và tạm dừng khi mở hộp thoại. Rời trang giải phóng renderer, geometry, texture và event listener. Khi WebGL không có hoặc mất context, các nút nội dung vẫn dùng được. Lưu bài và mở tuần không thuộc renderer.

Skill nguồn: [threejs-game-skills](https://github.com/majidmanzarpour/threejs-game-skills). Thiết kế và giới hạn kiểm chứng ghi tại `artifacts/game-progress.md` và `artifacts/final-evidence.md`. Chưa có kiểm tra hình ảnh/trò chơi WebGL trực tiếp trong trình duyệt ở phiên làm việc này.

## Giai đoạn hiện tại: dùng không cần đăng nhập

Theo yêu cầu mới, giao diện dùng `public/guest.mjs` để lưu hồ sơ, lượt làm và đánh giá trong localStorage. Trang được mở công khai. Nút tải dữ liệu và khôi phục cho phép chuyển hồ sơ giữa thiết bị. Supabase chưa được kết nối.

`/api/guest-content` chỉ công khai bộ tài liệu và câu hỏi; `/api/time` cung cấp thời gian đối chiếu. Các API gia đình cũ vẫn yêu cầu định danh và kiểm tra quyền sở hữu, nên dữ liệu máy chủ cũ không được công khai. Binding D1 và các bảng được giữ nguyên để bảo toàn dữ liệu đã có. Phần dưới mô tả backend đã chuẩn bị, hiện không được giao diện khách gọi để lưu dữ liệu.

## Chạy và kiểm tra

Node.js 24+, `npm ci`, `npm test`, `npm run build`. Đầu ra là Worker ESM tại `dist/server/index.js`; các tài nguyên giao diện được nhúng để giữ artifact độc lập.

`db/schema.js` khai báo SQLite/D1; `npm run db:generate` tạo migration Drizzle. Migration đã áp dụng không được sửa. Hosting khai báo binding `DB`. Không tạo bảng trong request.

## Dữ liệu và phân quyền

Sites cung cấp định danh tài khoản qua header `oai-authenticated-user-id`. Các API gia đình của backend đã chuẩn bị yêu cầu định danh và kiểm tra hồ sơ thuộc tài khoản đó. Giao diện khách hiện tại lưu kết quả trong localStorage như mô tả ở trên; Supabase chưa kết nối. Mỗi gia đình có tối đa 8 hồ sơ.

Máy chủ lưu hồ sơ, lượt làm, lựa chọn gốc, thứ tự lựa chọn hiển thị, thời gian trả lời, mốc hoàn thành đầu tiên, nhật ký tuần và lịch sử đánh giá. Thời gian mở khóa là mốc hoàn thành đầu tiên của tuần trước + 604800000 ms. Lượt luyện không thay đổi mốc này. Hoàn thành cần đủ 10 tình huống, không cần điểm tối thiểu.

## Báo cáo

12 tháng **theo lộ trình**, mỗi quý chia 4 + 4 + 5 tuần; 4 quý gồm 13 tuần; năm gồm 52 tuần. Đây không phải tháng lịch. Tỷ lệ lựa chọn phù hợp lần đầu và lượt gần nhất dùng cùng các tuần đã hoàn thành; bài đang làm chỉ được tính vào số câu đã lưu. 16 chân dung được cha mẹ và trẻ cùng ghi nhận, không suy ra từ tỷ lệ trắc nghiệm. Mỗi lần lưu giữ một bản đánh giá kèm ảnh chụp số liệu tại thời điểm đó.

## Rà soát nội dung

`content-review.md` mô tả các tình huống trùng ý đã xác minh. Không có trùng nguyên văn, nhưng không thể coi 52 bộ là không lặp ý. Các tuần tổng kết được giữ nguyên. `data/editorial-notes.json` ghi rõ lựa chọn khác cũng phù hợp, lưu ý an toàn và hiệu chỉnh ở câu 50.3. Nguyên văn tài liệu luôn được giữ để đối chiếu; mỗi lượt làm lưu hash phiên bản nội dung và kết quả chấm tại thời điểm trả lời.

Không có công cụ kiểm tra bằng trình duyệt trong môi trường hiện tại. Đã kiểm tra cú pháp, artifact và luồng API bằng SQLite thật, bao gồm toàn bộ 52 tuần, phân quyền, thời điểm mở khóa, báo cáo, lịch sử đánh giá và xuất dữ liệu.
