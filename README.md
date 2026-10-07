# Mầm Sáng · 52 tuần

52 bộ tình huống (520 câu), 16 chân dung trong bảng tự đánh giá, bản tổng kết năm và tài liệu nguyên văn.

## Thế giới 3D

`src/world.mjs` dựng thế giới Three.js gồm 52 đảo, 4 vùng, nhân vật bay tới đảo đã mở, cây lớn lên theo tuần hoàn thành và trò nhặt 3 đốm sáng tự do. Đốm sáng là tương tác khám phá, không thay đổi điểm, mốc mở khóa hay dữ liệu làm bài. `#world` và `#journey` mở thế giới 3D; `#map` giữ toàn bộ lộ trình 2D. Có chọn đảo bằng bàn phím/dropdown và tự hiển thị đường dẫn sang 2D khi WebGL không có hoặc mất context.

Three.js được đóng gói cùng artifact, không tải từ CDN. Cảnh gom các geometry tĩnh theo material, giới hạn pixel ratio và tốc độ khung hình; tôn trọng reduced-motion. Rời cảnh sẽ giải phóng renderer, controls, geometry, texture và bộ quan sát kích thước. Ngân hàng câu hỏi, khóa phiên bản dữ liệu, tiến độ và báo cáo không thay đổi.

## Giai đoạn hiện tại: dùng không cần đăng nhập

Theo yêu cầu mới, giao diện dùng `public/guest.mjs` để lưu hồ sơ, lượt làm và đánh giá trong localStorage. Trang được mở công khai. Nút tải dữ liệu và khôi phục cho phép chuyển hồ sơ giữa thiết bị. Supabase chưa được kết nối.

`/api/guest-content` chỉ công khai bộ tài liệu và câu hỏi; `/api/time` cung cấp thời gian đối chiếu. Các API gia đình cũ vẫn yêu cầu định danh và kiểm tra quyền sở hữu, nên dữ liệu máy chủ cũ không được công khai. Binding D1 và các bảng được giữ nguyên để bảo toàn dữ liệu đã có. Phần dưới mô tả backend đã chuẩn bị, hiện không được giao diện khách gọi để lưu dữ liệu.

## Chạy và kiểm tra

Node.js 24+, `npm ci`, `npm test`, `npm run build`. Đầu ra là Worker ESM tại `dist/server/index.js`; các tài nguyên giao diện được nhúng để giữ artifact độc lập.

`db/schema.js` khai báo SQLite/D1; `npm run db:generate` tạo migration Drizzle. Migration đã áp dụng không được sửa. Hosting khai báo binding `DB`. Không tạo bảng trong request.

## Dữ liệu và phân quyền

Sites cung cấp định danh tài khoản qua header `oai-authenticated-user-id`. Mọi API yêu cầu định danh và kiểm tra hồ sơ thuộc tài khoản đó. Mỗi gia đình có tối đa 8 hồ sơ. Không lưu kết quả trắc nghiệm trong localStorage; trình duyệt chỉ nhớ hồ sơ được chọn.

Máy chủ lưu hồ sơ, lượt làm, lựa chọn gốc, thứ tự lựa chọn hiển thị, thời gian trả lời, mốc hoàn thành đầu tiên, nhật ký tuần và lịch sử đánh giá. Thời gian mở khóa là mốc hoàn thành đầu tiên của tuần trước + 604800000 ms. Lượt luyện không thay đổi mốc này. Hoàn thành cần đủ 10 tình huống, không cần điểm tối thiểu.

## Báo cáo

12 tháng **theo lộ trình**, mỗi quý chia 4 + 4 + 5 tuần; 4 quý gồm 13 tuần; năm gồm 52 tuần. Đây không phải tháng lịch. Tỷ lệ lựa chọn phù hợp lần đầu và lượt gần nhất dùng cùng các tuần đã hoàn thành; bài đang làm chỉ được tính vào số câu đã lưu. 16 chân dung được cha mẹ và trẻ cùng ghi nhận, không suy ra từ tỷ lệ trắc nghiệm. Mỗi lần lưu giữ một bản đánh giá kèm ảnh chụp số liệu tại thời điểm đó.

## Rà soát nội dung

`content-review.md` mô tả các tình huống trùng ý đã xác minh. Không có trùng nguyên văn, nhưng không thể coi 52 bộ là không lặp ý. Các tuần tổng kết được giữ nguyên. `data/editorial-notes.json` ghi rõ lựa chọn khác cũng phù hợp, lưu ý an toàn và hiệu chỉnh ở câu 50.3. Nguyên văn tài liệu luôn được giữ để đối chiếu; mỗi lượt làm lưu hash phiên bản nội dung và kết quả chấm tại thời điểm trả lời.

Không có công cụ kiểm tra bằng trình duyệt trong môi trường hiện tại. Đã kiểm tra cú pháp, artifact và luồng API bằng SQLite thật, bao gồm toàn bộ 52 tuần, phân quyền, thời điểm mở khóa, báo cáo, lịch sử đánh giá và xuất dữ liệu.
