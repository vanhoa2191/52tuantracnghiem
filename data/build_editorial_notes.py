import json
from pathlib import Path

notes = {}
def add(ref, alternatives=None, **kwargs):
    entry = notes.setdefault(ref, {})
    if alternatives:
        entry.setdefault('validAlternatives', {}).update(alternatives)
    entry.update(kwargs)

alternatives = {
 '15.2': {'A':'Đặt câu hỏi để cải thiện điểm cũng là bước chủ động. Có thể nói cụ thể hơn: mình cần luyện kỹ năng viết nào?'},
 '23.7': {'A':'Tính nhẩm từng bước vẫn là cách học toán phù hợp. Con được kiểm tra lại kết quả; làm tròn chỉ cho kết quả ước lượng nếu không tính phần chênh lệch.'},
 '29.3': {'B':'Con được giữ khoảng cách để an toàn. Nếu tranh cãi căng thẳng, hãy báo giáo viên; trẻ không phải tự hòa giải mọi mâu thuẫn.'},
 '34.6': {'C':'Nhờ bạn đi sau tắt đèn cũng là phối hợp có trách nhiệm, nếu xác nhận bạn đã thực hiện.'},
 '35.9': {'C':'Gọi bố mẹ ra nhận hàng là lựa chọn an toàn. Con không cần tự mở cửa hoặc nhận đồ từ người chưa quen.'},
 '38.7': {'C':'Nhờ bố mẹ giữ hộ và cùng kiểm tra số tiền giúp con học quản lý tiền. Hỏi về tiền của mình không phải hành vi sai.'},
 '40.1': {'A':'Quan sát từ nơi an toàn giúp con làm quen với bơi; con có thể trao đổi với thầy khi sẵn sàng.', 'C':'Xin bài tập dễ, phù hợp khả năng là cách học bơi an toàn cùng người hướng dẫn.', 'D':'Con có quyền lựa chọn môn vận động phù hợp; đổi môn không có nghĩa con kém dũng cảm.'},
 '40.3': {'A':'Nói thật rằng chưa chuẩn bị và xin hỗ trợ là phù hợp. Con có thể cùng cô lên kế hoạch tập nói từng bước.'},
 '40.8': {'A':'Đệm đàn cũng là đóng góp có giá trị nếu phù hợp năng lực và mong muốn của con; không bắt buộc phải hát.'},
 '41.4': {'C':'Hoàn thành bài đúng hạn là mục tiêu rõ ràng, vừa sức. Con có thể bổ sung nghỉ ngơi và hoạt động mình thích.'},
 '41.7': {'D':'Ăn đa dạng, đủ chất góp phần vào sức khỏe lâu dài. Kết hợp ngủ đủ và vận động vừa sức sẽ đầy đủ hơn.'},
 '41.9': {'A':'Nhờ gia đình giúp khi khó khăn là cách tìm nguồn hỗ trợ lành mạnh; không phải mọi thử thách con đều phải tự vượt qua.'},
 '42.7': {'A':'Cho mượn sách giúp bạn tiếp cận việc đọc và chia sẻ niềm yêu sách.', 'C':'Cùng đi thư viện là hành động cụ thể để phát triển thói quen đọc.'},
 '42.8': {'A':'Phân công theo năng lực giúp nhóm hợp tác công bằng; trưởng nhóm cũng cần thực hiện phần việc của mình.', 'D':'Nhận phần còn lại sau khi các bạn chọn việc thể hiện sự sẵn sàng tham gia, nếu công việc vừa sức và phân chia công bằng.'},
 '42.9': {'D':'Tóm tắt đúng ý sau khi bạn nói xong cho thấy con đã lắng nghe và giúp nhóm hiểu nhau.'},
 '43.8': {'C':'Ghi nhận sự nhanh nhẹn của bố cũng là ghi nhận một giá trị không phải tiền bạc. Thêm lời cảm ơn sẽ giúp thể hiện tình cảm rõ hơn.'},
 '44.3': {'A':'Con được thất vọng và cần một khoảng riêng để bình tĩnh; có thể quay lại trò chuyện khi sẵn sàng.'},
 '44.5': {'C':'Chia sẻ với bố mẹ rằng bài tập quá tải giúp con nhận hỗ trợ và điều chỉnh kế hoạch, không phải lỗi của con.'},
 '44.8': {},
 '45.8': {},
 '46.7': {'C':'Nhắm mắt nghỉ ngắn giúp mắt và tâm trí thư giãn; con có thể đứng dậy vận động và nhìn xa sau đó.'},
 '46.8': {'C':'Tự nhắc một câu dịu dàng có thể giúp con bình tĩnh. Nếu lo lắng kéo dài, hãy tìm người tin cậy để trò chuyện.'},
 '46.9': {'C':'Giữ vệ sinh đều đặn cũng rèn thói quen và kỷ luật cá nhân; mục đích chính vẫn là chăm sóc sức khỏe.'},
 '46.10': {'A':'Sức khỏe hỗ trợ việc học và cảm giác dễ chịu; điều này thể hiện một chiều của mối quan hệ.', 'D':'Sức khỏe và cảm xúc có thể hỗ trợ lẫn nhau trong sinh hoạt; không phải lúc nào cũng cần vui để khỏe.'},
 '47.2': {'A':'Nhắc nhẹ nhàng có thể giúp ông bà nhớ mà vẫn giữ sự tôn trọng.', 'C':'Báo bố mẹ về thay đổi trí nhớ giúp gia đình chăm sóc ông bà phù hợp.', 'D':'Ghi chú rõ ràng giúp ông bà tìm đồ thuận tiện và thể hiện sự quan tâm.'},
 '47.4': {'C':'Con được rời cuộc tranh luận để giữ an toàn và để người lớn giải quyết. Con không có trách nhiệm hòa giải bố mẹ.', 'D':'Đề xuất tạm nghỉ có thể giúp giảm căng thẳng nếu mọi người đồng ý; đồ ngọt không phải điều bắt buộc.'},
 '47.5': {'D':'Cùng bố nấu bữa ăn vừa sức, có người lớn hướng dẫn, cũng là món quà tự làm và kết nối tình cảm.'},
 '47.6': {'C':'Cho bạn mượn đồ chơi là một cách quan tâm nếu bạn thích; con cũng có thể hỏi bạn có muốn được lắng nghe không.'},
 '47.7': {'C':'Giúp một việc vừa sức có thể san sẻ gánh nặng; vẫn nên hỏi xem anh chị em có muốn được giúp không.', 'D':'Tôn trọng không gian riêng là phù hợp; con có thể nhắn rằng mình sẵn sàng lắng nghe khi người ấy muốn.'},
 '47.8': {'A':'Sẵn sàng hỗ trợ bạn trong khả năng an toàn giúp xây dựng tình bạn; con vẫn được giữ ranh giới riêng.'},
 '47.9': {'A':'Hỏi thăm bạn thể hiện quan tâm mà không cần mua quà.', 'C':'Mời bạn xem ảnh và chia sẻ câu chuyện là cách kết nối vui vẻ.', 'D':'Chia sẻ đặc sản có thể thể hiện tình cảm; cần hỏi về dị ứng và được người lớn đồng ý.'},
 '47.10': {'A':'Gia đình hỗ trợ việc học là một lợi ích phù hợp, dù ý nghĩa của sự hòa hợp rộng hơn.'},
 '48.1': {'C':'Làm câu dễ trước rồi quay lại câu khó giúp quản lý thời gian và lấy lại tự tin.', 'D':'Tham khảo nguồn đáng tin để hiểu phương pháp là cách học phù hợp; con không chép lời giải làm bài của mình.'},
 '48.2': {'D':'So sánh giá dùng kỹ năng về số và tiền để lựa chọn mua sắm phù hợp.'},
 '48.3': {'C':'Xem mô phỏng từ nguồn đáng tin giúp hiểu vòng tuần hoàn nước; nên cùng người lớn chọn video phù hợp.', 'D':'Tự làm bài tập khoa học cũng là cách vận dụng kiến thức, có thể kết hợp quan sát thực tế.'},
 '48.4': {'C':'Tự học đều giúp chuẩn bị cho kỳ thi, dù điểm thi không phải mục đích duy nhất.', 'D':'Tự học đều rèn tính kiên trì và thói quen học tập.'},
 '48.5': {'A':'Ghi nhớ các mốc quan trọng là một cách hệ thống bài lịch sử.', 'D':'Kể lại cho bạn giúp con sắp xếp sự kiện và ghi nhớ ý nghĩa bài học.'},
 '48.6': {'A':'Nhờ thầy cô chỉ ra điểm cần luyện là cách trực tiếp cải thiện học tập.', 'D':'Kế hoạch từ vựng đều đặn là cách rèn năng lực tiếng Anh; nên kết hợp xem lỗi bài vừa làm.'},
 '48.7': {'A':'Luyện giọng rõ, âm lượng vừa đủ giúp người nghe hiểu; không cần hét thật to.', 'C':'Quan sát diễn giả giúp học cách trình bày và tổ chức ý.', 'D':'Chuẩn bị kỹ giúp con hiểu nội dung và nói tự tin hơn.'},
 '48.8': {'A':'Chú ý theo dõi để hiểu kiến thức là tâm thái học hỏi phù hợp.', 'C':'Trao đổi cùng bố mẹ giúp con đặt câu hỏi và hiểu sâu hơn.', 'D':'Tìm thêm thông tin ở nguồn đáng tin, với người lớn hỗ trợ, là cách chủ động khám phá.'},
 '48.9': {'A':'Hợp tác có thể giúp làm bài hiệu quả; vẫn cần bảo đảm mọi người được học và tham gia.', 'C':'Làm nhóm giúp tăng sự gắn kết khi các bạn tôn trọng nhau.', 'D':'Trình bày lý do cho ý kiến của mình cũng rèn giao tiếp; cần lắng nghe và sẵn sàng điều chỉnh.'},
 '48.10': {'C':'Theo đuổi mục tiêu có ý nghĩa là một động lực học tập phù hợp.', 'D':'Khám phá tri thức là mục đích học tập có giá trị.'},
 '49.1': {'A':'Nhờ bố mẹ giữ tiền là phù hợp với tuổi; có thể cùng theo dõi và lập kế hoạch sử dụng.', 'C':'Lập danh sách đồ cần mua giúp phân biệt nhu cầu và dùng tiền có kế hoạch.'},
 '49.2': {'D':'Tiếc một chút rồi đi cùng mẹ vẫn thể hiện con tôn trọng quyết định và không mua thêm đồ chưa cần.'},
 '49.3': {'D':'Lau chùi cặp và hộp bút giúp giữ đồ dùng sạch, bền.'},
 '49.4': {'A':'Nói thật và xin lỗi là phù hợp; nên cùng tìm cách cất tiền an toàn hơn.', 'C':'Nhờ khâu túi thủng giải quyết nguyên nhân làm rơi tiền, đồng thời nên cất tiền trong ví.'},
 '49.5': {'C':'Tiết kiệm có kế hoạch giúp rèn kỷ luật tài chính.', 'D':'Có khoản tiết kiệm riêng giúp con học tự chủ trong phạm vi phù hợp với tuổi.'},
 '49.6': {'A':'Chăm sóc việc học và sinh hoạt vừa sức là cách quan tâm bố mẹ; con vẫn được nghỉ và chơi.', 'C':'Giúp việc nhà vừa sức là cách cụ thể để san sẻ.'},
 '49.7': {'A':'Món quà hữu ích lâu dài là lựa chọn phù hợp nếu vừa ngân sách.', 'C':'Quà tự làm chứa tình cảm và không cần tốn nhiều tiền.', 'D':'Hỏi sở thích giúp chọn quà hợp ý bạn và tránh mua đồ không cần.'},
 '49.8': {'A':'Nhắc cả nhà tiết kiệm một cách tôn trọng cũng góp phần giữ tài nguyên.', 'C':'Tránh mua món chưa cần là cách tiết kiệm.', 'D':'Dùng thiết bị đúng hướng dẫn giúp tránh hư hỏng và tiết kiệm; trẻ không tự sửa điện.'},
 '49.9': {'C':'Giao tiền cho bảo vệ trường là nhờ người lớn có trách nhiệm tìm người mất, tương đương giao giáo viên.'},
 '49.10': {'A':'Quản lý tài chính tốt là một phần của sự tự chủ.', 'D':'Biết sử dụng tiền hợp lý là mục tiêu phù hợp của tài chính thông minh.'},
 '50.1': {'C':'Đóng góp học tập có thể giúp tập thể; giá trị của con không chỉ nằm ở điểm số.', 'D':'Lắng nghe và tuân thủ quy định an toàn cũng góp phần xây dựng tập thể.'},
 '50.2': {'D':'Rủ bạn cùng quyên góp đồ còn tốt thể hiện hợp tác và quan tâm cộng đồng.'},
 '50.4': {'A':'Kể chuyện học tập có thể đem niềm vui và giúp ông bà gần con hơn.', 'C':'Bức tranh tự vẽ là món quà tình cảm, không cần mua sắm.', 'D':'Quà nhỏ trong ngân sách cũng thể hiện quan tâm; việc mua quà không bắt buộc.'},
 '50.5': {'C':'Động viên nhẹ nhàng giúp bạn tự tin, vẫn cần cho bạn thời gian nói hết.', 'D':'Tạo thêm cơ hội nói, theo mong muốn của bạn, giúp mọi người được tham gia công bằng.'},
 '50.6': {'C':'Mở cửa giúp cô thuận tiện là hỗ trợ vừa sức, không cần mang đồ nặng.', 'D':'Nhờ thêm người hỗ trợ giúp chia việc vừa sức; không chạy hoặc chen nhau trên cầu thang.'},
 '50.7': {'C':'Tham gia hoạt động cống hiến vừa sức đem lợi ích cho cộng đồng.', 'D':'Chia sẻ kiến thức là cách giúp bạn và lan tỏa giá trị.'},
 '50.8': {'A':'Làm theo người hướng dẫn giúp trồng cây an toàn và hiệu quả.', 'C':'Phân công hợp tác là đóng góp nếu con cũng làm phần việc vừa sức.', 'D':'Nhắc nhẹ để giữ cây là một cách bảo vệ thành quả chung.'},
 '50.10': {'A':'Góp phần giúp xã hội tốt đẹp là ý nghĩa trực tiếp của cống hiến.', 'D':'Hoạt động vừa sức giúp con khám phá và phát triển khả năng.'},
 '51.1': {'C':'Hỏi bố mẹ là bước khởi đầu phù hợp để xây kế hoạch hè cân bằng.'},
 '51.2': {'C':'Làm đúng hạn góp phần rèn kỷ luật cá nhân.'},
 '51.3': {'C':'Tách việc học và chơi, làm bài trước rồi chơi, là cách tránh bị xao nhãng.', 'D':'Lập lịch riêng giúp học và chơi có thời gian rõ ràng; cần nghỉ xen kẽ phù hợp.'},
 '51.4': {'D':'Cân bằng học và chơi là một phần quan trọng của tự quản lý thời gian.'},
 '51.5': {'D':'Chuẩn bị từ trưa giúp tránh quên đồ; vẫn cần tính thời gian di chuyển để đúng hẹn.'},
 '51.6': {'C':'Phân chia thời gian từng môn có thể phù hợp; nên điều chỉnh theo hạn nộp và mức độ khó.', 'D':'Ưu tiên bài cần cho ngày mai cũng là kế hoạch hợp lý nếu bảo đảm các hạn nộp khác.'},
 '51.7': {'A':'Nghỉ ngơi giúp hồi phục, cũng là cách sử dụng thời gian có giá trị.', 'C':'Ôn bài vừa sức giúp hệ thống kiến thức; cần dành thời gian nghỉ và chơi.', 'D':'Câu lạc bộ yêu thích giúp khám phá năng khiếu và kết bạn.'},
 '51.9': {'C':'Nhờ bố mẹ hỗ trợ đánh thức là phù hợp theo tuổi; cùng điều chỉnh giấc ngủ.', 'D':'Chuẩn bị buổi tối giúp buổi sáng đỡ vội, kết hợp ngủ đủ và dậy đúng giờ.'},
 '51.10': {'A':'Tự tin và tự lập là lợi ích của quản lý thời gian, đồng thời con vẫn được xin giúp đỡ.', 'D':'Tự hào về tiến bộ của mình là cảm xúc phù hợp.'},
 '52.3': {'A':'Tìm nguyên nhân và giải pháp là cách xử lý khó khăn thực tế.', 'C':'Nhờ người tin cậy hỗ trợ là cách tìm thêm nguồn lực, không phải sự yếu kém.', 'D':'Nhìn khó khăn như cơ hội học có thể tạo động lực; vẫn cần tôn trọng giới hạn an toàn.'},
 '52.5': {'D':'Trực tiếp tham gia việc tốt cũng là một cách làm gương.'},
 '52.6': {'C':'Quà tự làm và lời cảm ơn là cách thể hiện tri ân sâu sắc, không cần mua quà.'},
 '52.7': {'C':'Sẵn sàng học hỏi là tâm thái tích cực khi vào năm mới.', 'D':'Tự hào về sự cố gắng của mình giúp nhận ra tiến bộ; vẫn tiếp tục học hỏi.'},
 '52.9': {'A':'Lời hứa cố gắng học và sống tốt thể hiện mong muốn phát triển; mục tiêu nên vừa sức.', 'C':'Kiên trì với ước mơ là lời hứa tích cực; con được điều chỉnh khi sở thích thay đổi.'},
 '52.10': {'C':'Tự tin và thử điều mới là thông điệp khích lệ phù hợp.'},
}
for ref, value in alternatives.items():
    if value:
        add(ref, value, rationale='Rà soát biên tập: lựa chọn này là một cách khác cũng phù hợp; đáp án và nội dung gốc vẫn được lưu nguyên vẹn.')

safety = {
 '1.1':'Tránh xa kính vỡ và gọi người lớn dọn; con không nhặt bằng tay, kể cả khi muốn nhận lỗi.',
 '1.7':'Đội mũ bảo hiểm, tập ở nơi an toàn có người lớn. Nếu ngã đau, dừng và kiểm tra chấn thương trước khi tập tiếp.',
 '3.6':'Con được buồn và nói rằng lời gắt gỏng làm mình tổn thương. Người lớn chịu trách nhiệm điều chỉnh cảm xúc; con không phải làm bố mẹ hết giận. Nếu thấy không an toàn, tìm người lớn tin cậy.',
 '3.10':'Sau ngã, kiểm tra chỗ đau và báo người lớn; không bắt buộc đứng dậy hoặc chơi tiếp khi đau, chóng mặt hay có chấn thương.',
 '4.5':'Nhờ người lớn chọn thuốc phù hợp; không tự dùng thuốc bôi. Báo người lớn nếu sưng nhiều hoặc có dấu hiệu bất thường.',
 '8.2':'Không tự chạm chim hoang dã bị thương; giữ khoảng cách và báo giáo viên/người có chuyên môn.',
 '8.3':'Báo người lớn và kiểm tra chấn thương; hỏi em có muốn được ôm không, tránh xoa vào vết thương.',
 '8.7':'Ở nơi công cộng an toàn và gọi bảo vệ/người lớn tin cậy. Không tự dẫn em đi xa hoặc đi theo người lạ.',
 '10.4':'Gọi giáo viên/nhân viên y tế trước. Không tự kéo hoặc dìu bạn nếu nghi chấn thương nặng; tránh tiếp xúc trực tiếp với máu.',
 '12.9':'Tôn trọng chuyện riêng của bạn, nhưng bí mật liên quan đến nguy hiểm, bị xâm hại hoặc tự làm đau cần báo người lớn tin cậy. Nhờ giúp để bảo vệ bạn không phải phản bội.',
 '17.9':'Nếu các bạn đánh nhau, giữ khoảng cách và gọi giáo viên; không chen vào giữa để hòa giải.',
 '18.5':'Chỉ làm thí nghiệm với vật liệu được giáo viên cho phép và có người lớn hướng dẫn; không tự pha hoặc thử dung dịch lạ.',
 '22.5':'Người lớn phải ngắt điện trước khi sửa. Con chỉ quan sát ở khoảng cách an toàn, không chạm bộ phận điện hoặc tự dùng tua-vít sửa quạt.',
 '23.2':'Nhờ người lớn kiểm tra và lắp kệ chắc chắn; không tự treo kệ hoặc leo cao để đặt sách.',
 '24.5':'Dừng lại và báo người lớn nếu đau, chóng mặt hoặc khó thở; hoàn thành đường chạy không quan trọng hơn an toàn.',
 '24.9':'Có thể nghỉ khi mệt rồi tiếp tục sau; việc giúp bạn không yêu cầu con làm đến kiệt sức.',
 '27.3':'Uống nước giúp bổ sung nước cho cơ thể. Không xem nước ấm là cách thải độc hay làm sạch cơ thể; dùng nước sạch ở nhiệt độ dễ chịu.',
 '27.6':'Nước chỉ ấm vừa, có người lớn kiểm tra; không ngâm hoặc xoa bóp chỗ bị chấn thương khi chưa được hướng dẫn.',
 '27.8':'Báo người lớn, rửa bằng nước sạch và chăm sóc theo hướng dẫn; không tự dùng thuốc sát trùng lạ.',
 '28.1':'Không cố vượt giới hạn khi thở dồn dập. Giảm tốc hoặc nghỉ; nếu khó thở, đau hay chóng mặt, dừng và báo người hướng dẫn.',
 '28.3':'Chỉ học bơi ở nơi có người hướng dẫn và giám sát, không tự xuống chỗ sâu hoặc thử bơi một mình.',
 '28.5':'Số lần tập phải theo tuổi và khả năng, do người hướng dẫn điều chỉnh; dừng khi đau hoặc không giữ được tư thế.',
 '28.7':'Mỏi cơ không luôn có nghĩa cơ thể đang tăng trưởng. Nghỉ và báo người lớn nếu đau nhiều hoặc kéo dài; không cố tập tiếp để chứng tỏ ý chí.',
 '28.8':'Chỉ leo với người hướng dẫn, dây và thiết bị an toàn được kiểm tra; con được dừng khi không thoải mái.',
 '33.2':'Không vuốt ve hoặc cho ăn chó lạ khi chưa có người lớn hướng dẫn. Giữ khoảng cách và báo bảo vệ để hỗ trợ tìm chủ an toàn.',
 '33.4':'Thuốc chỉ dùng theo người lớn và hướng dẫn chuyên môn; không tự chọn thuốc hoặc uống thêm vì muốn khỏi nhanh.',
 '33.5':'Gọi giáo viên/y tế và kiểm tra chấn thương trước khi đỡ bạn đứng dậy. Không tự di chuyển bạn nếu nghi chấn thương nặng.',
 '33.10':'Lời chê có thể làm con buồn và điều đó bình thường. Con được nói mình không thích lời trêu, tìm người tin cậy giúp nếu bị lặp lại.',
 '35.9':'Không tự mở cửa cho người chưa quen hoặc cung cấp thông tin gia đình; gọi bố mẹ/người chăm sóc ra nhận hàng.',
 '37.4':'Giữ chuyện riêng tích cực của bạn. Nếu bí mật khiến ai đó gặp nguy hiểm, báo người lớn tin cậy để bảo vệ bạn.',
 '39.6':'Không tự dẫn người khác qua đường đông xe. Đứng nơi an toàn và gọi người lớn/công an hỗ trợ theo tín hiệu giao thông.',
 '40.5':'Tập xe có người lớn, đội mũ bảo hiểm và kiểm tra chấn thương sau ngã; ngã đau không phải điều bắt buộc để học.',
 '44.6':'Giận là cảm xúc bình thường, không làm con thành người xấu. Chú ý cách hành động khi giận: dừng lại, gọi tên cảm xúc và nhờ hỗ trợ; không cần ép mình cười.',
 '46.4':'Vận động theo tuổi, sức khỏe và hướng dẫn; 30 phút trong tài liệu không phải mức chuẩn áp dụng cho mọi trẻ. Bơi cần người giám sát, đạp xe cần mũ bảo hiểm.',
 '46.6':'Nụ cười có thể giúp cảm thấy gần gũi và dễ chịu. Nó không bảo đảm may mắn, không ngăn bệnh và không thay thế chăm sóc y tế. Con không cần ép cười khi buồn.',
 '46.8':'Không cần xé giấy hay tự loại bỏ mọi lo lắng. Trò chuyện với người tin cậy, và tìm hỗ trợ khi lo kéo dài hoặc ảnh hưởng sinh hoạt.',
 '47.1':'Chỉ ôm khi cả hai đồng ý. Con được có cảm xúc khác vui và không chịu trách nhiệm giữ gia đình luôn hòa thuận.',
 '47.4':'Bất đồng của người lớn do người lớn giải quyết. Con được rời chỗ tranh cãi và gọi người tin cậy nếu thấy sợ; không cần ca hát để làm dịu mọi người.',
 '47.6':'Hỏi bạn có muốn nắm tay hay được ôm không. Lắng nghe không ép bạn kể chuyện riêng và báo người lớn nếu bạn có nguy cơ bị tổn hại.',
 '49.6':'Khó khăn tài chính là trách nhiệm của người lớn. Con giúp việc vừa sức và giữ nhu cầu ăn uống, học tập, nghỉ ngơi; không cần hy sinh nhu cầu thiết yếu.',
 '50.3':'Không tới mép hồ, trèo xuống nước hoặc dùng cành cây với ra. Giữ em nhỏ cách xa nước và gọi người lớn từ vị trí an toàn.',
 '50.4':'Ông bà có thể thích trò chuyện hoặc tranh vẽ; không cần nhổ tóc hay xoa bóp. Chỉ chạm cơ thể khi người ấy đồng ý và người lớn hướng dẫn.',
 '50.6':'Đi chậm trên cầu thang, chỉ mang đồ vừa sức với sự đồng ý của cô; có thể mở cửa hoặc gọi người hỗ trợ.',
 '50.9':'Con có giá trị vốn có, kể cả lúc sai, buồn hoặc chưa giúp được ai; tình yêu thương không phụ thuộc thành tích hay sự ngoan ngoãn.',
 '51.3':'30 phút học và 15 phút chơi trong tài liệu là ví dụ, không phải hạn cố định. Điều chỉnh theo bài và khả năng, nghỉ khi cần.',
 '51.8':'Nghỉ ngơi, tưởng tượng và trò chuyện với bạn không tự động là lãng phí. Điều quan trọng là cân bằng và không để hoạt động ảnh hưởng giấc ngủ, an toàn hoặc trách nhiệm.',
 '51.9':'Giờ ngủ cần phù hợp tuổi và bảo đảm ngủ đủ. Cùng bố mẹ tìm nguyên nhân dậy muộn; không dùng nhiều chuông làm mất ngủ cả nhà.',
 '52.6':'Chỉ ôm khi con và người thân đồng ý; thư, lời cảm ơn hoặc quà tự làm đều thể hiện tình cảm.',
}
for ref, value in safety.items():
    add(ref, safety=value)
add('50.3', overrideAnswer='A', overrideExplanation='Trong phiên bản dành cho trẻ, A được chọn để ưu tiên an toàn: giữ mình và em nhỏ xa mép hồ, gọi người lớn trợ giúp. Tài liệu gốc chọn B; phần gợi ý tự khều khăn ở hồ không được khuyến khích trong ứng dụng.', rationale='Điều chỉnh an toàn được công khai riêng; không sửa câu chữ hay đáp án trong tài liệu nguồn.')
add('1.3', overrideExplanation='Bật đèn và tìm hoạt động nhẹ nhàng có thể giúp con bớt sợ. Nỗi sợ vẫn có thể còn; con được gọi bố mẹ hoặc người tin cậy cùng ở bên, không cần tự làm cảm xúc biến mất ngay.')
add('28.7', overrideExplanation='Sau tập, nghỉ ngơi và chăm sóc cơ thể giúp hồi phục. Mỏi cơ không phải thước đo con phát triển tốt; nếu đau nhiều hoặc kéo dài, hãy báo người lớn và làm theo hướng dẫn.')
add('44.6', overrideExplanation='Khi giận kéo dài, con có thể mệt và khó tập trung. Cảm xúc giận vẫn bình thường; con có thể nhận biết nó, nghỉ một chút, nói điều mình cần và nhờ người tin cậy giúp.')
add('46.6', overrideExplanation='Nụ cười chân thành có thể đem cảm giác dễ chịu và giúp kết nối với người thân. Sức khỏe cần ngủ đủ, ăn uống, vận động và chăm sóc phù hợp; cười không bảo đảm may mắn hoặc khỏe cả ngày.')
add('50.9', overrideExplanation='Con có giá trị và xứng đáng được yêu thương ngay cả khi mắc lỗi, buồn hoặc chưa đạt thành tích. Những hành động tốt là điều con có thể rèn thêm, không phải điều kiện để được trân trọng.')

bank=json.loads(Path('/workspace/sites/mam-sang-52/dist/content.json').read_text())
indexed={f'{w["id"]}.{q["id"]}':q for w in bank['weeks'] for q in w['questions']}
for ref, entry in notes.items():
    assert ref in indexed, ref
    for key in entry.get('validAlternatives', {}):
        assert key in indexed[ref]['options'] and key != indexed[ref]['answer'], (ref,key)
    if 'overrideAnswer' in entry: assert entry['overrideAnswer'] in indexed[ref]['options']
Path('/workspace/sites/mam-sang-52/data/editorial-notes.json').write_text(json.dumps(notes,ensure_ascii=False,indent=2)+'\n')
print(len(notes),'reviewed question annotations;',sum(len(n.get('validAlternatives',{})) for n in notes.values()),'accepted alternatives')
