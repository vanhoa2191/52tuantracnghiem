from pathlib import Path
import re, json, shutil

ROOT = Path(__file__).resolve().parents[1]
source = Path('/workspace/attachments/8abe6a90-aee5-49a0-b951-522691d7e57d/Pasted text.txt')
text = source.read_text()
chunks = re.split(r'^TUẦN (\d+): (.+)$', text, flags=re.M)
roadmap = {}
for line in text.splitlines():
    match = re.match(r'^(\d{2})\t([^\t]+)\t(.+)$', line)
    if match:
        roadmap[int(match[1])] = {'title': match[2], 'goal': match[3]}

# Added explanations are clearly identified separately from the source text.
rules = [
    (r'đẩy (?:em|bạn).*ngã|đập|đánh (?:em|bạn|người)|xé |quăng|ném|thả tay|chọc bạn đang leo', 'Hành động này có thể làm con hoặc người khác bị đau, hỏng đồ hay mất an toàn. Khi bực mình, con có thể dừng lại và nhờ người lớn hỗ trợ.'),
    (r'nhìn lén|chép|gian|dối|giấu|lén|giả vờ|nhờ bạn.*hộ', 'Cách này che đi điều đang xảy ra hoặc để người khác làm thay, nên con chưa được rèn kỹ năng và khó nhận sự giúp đỡ phù hợp. Nói thật và tự làm phần mình có thể sẽ giúp con tiến bộ.'),
    (r'quát|mắng|hét|la |ầm ĩ|cãi|tranh cãi|ép buộc|dọa', 'Lời nói lớn tiếng hoặc ép buộc dễ làm người nghe sợ, buồn và khó hiểu mong muốn của con. Con có thể nói rõ cảm xúc và điều mình cần bằng lời tôn trọng.'),
    (r'đổ lỗi|oán trách|trách ', 'Chỉ quy lỗi cho hoàn cảnh hay người khác chưa giúp giải quyết việc đang xảy ra. Con có thể nhìn lại phần mình làm được và cùng tìm cách khắc phục.'),
    (r'chê|coi thường|kiêu|ngạo|so sánh|gièm|khoe|cười nhạo', 'Hạ thấp người khác hoặc so hơn thua có thể làm tổn thương và khiến mình bỏ lỡ điều đáng học. Con có thể tôn trọng mỗi người và ghi nhận sự cố gắng.'),
    (r'bỏ ăn|bỏ bữa|nhịn ăn|đồ ăn nhanh|ngủ.*muộn|thức.*khuya|lướt điện thoại|điện tử|điện thoại|chơi game', 'Lựa chọn này có thể ảnh hưởng đến bữa ăn, giấc ngủ hoặc thời gian dành cho việc cần làm. Con có thể nói nhu cầu của mình và cùng người lớn sắp xếp thói quen phù hợp.'),
    (r'bỏ cuộc|không bao giờ|từ chối|bỏ học|không.*học|không.*tập|bỏ .*|mặc kệ|không quan tâm|nằm .*|ngủ tiếp|ngủ nướng', 'Dừng hẳn hoặc bỏ qua việc này khiến vấn đề còn đó và con ít có cơ hội học thêm. Con có thể nghỉ khi cần, rồi thử một bước nhỏ hoặc nhờ người lớn giúp.'),
    (r'khóc|sợ|buồn|thở dài|giận|tức|bực|gục|trốn|im lặng|nhắm|chán|than', 'Cảm giác buồn, sợ hay tức giận là bình thường. Tuy nhiên, chỉ giữ trong lòng hoặc phản ứng theo cảm xúc chưa giải quyết được tình huống. Con có thể gọi tên cảm xúc và tìm người tin cậy để cùng nghĩ cách.'),
    (r'chờ|đợi|phụ thuộc|bắt bố mẹ|bắt .*phải', 'Chờ người khác giải quyết hết khiến con ít có cơ hội tự rèn luyện. Con có thể xin hỗ trợ cụ thể và chủ động làm phần vừa sức của mình.'),
]

def explanation(option, good):
    for pattern, message in rules:
        if re.search(pattern, option, re.I):
            return message + ' Trong tình huống này, một cách phù hợp hơn là: ' + good
    return ('Lựa chọn “' + option + '” chưa xử lý được nhu cầu của tình huống bằng sự chủ động và tôn trọng. '
            'Con có thể thử cách cụ thể sau: ' + good)

weeks = []
for i in range(1, len(chunks), 3):
    week = int(chunks[i]); body = chunks[i+2]
    qchunks = re.split(r'^Câu hỏi (\d+)\s*$', body, flags=re.M)
    questions = []
    for j in range(1, len(qchunks), 2):
        block = qchunks[j+1]
        def field(name):
            m = re.search(r'^\* ' + re.escape(name) + r':\s*(.*)$', block, re.M)
            assert m, (week, qchunks[j], name)
            return m[1].strip()
        options = dict(re.findall(r'^\s+\* ([ABCD])\. (.+)$', block, re.M))
        answer = field('Đáp án chuẩn xác')
        assert set(options) == set('ABCD') and answer in options
        scenario = field('Tình huống hằng ngày')
        note = None
        if re.search(r'thủy tinh|mảnh vỡ', scenario, re.I):
            note = 'Nếu có kính vỡ, con tránh xa mảnh kính và gọi người lớn dọn giúp; không nhặt bằng tay trần.'
        elif week == 28:
            note = 'Vận động vừa sức, theo hướng dẫn của người lớn. Nếu đau, chóng mặt hoặc khó thở, con dừng lại và báo người lớn; không cố vượt qua cơn đau. Bơi và leo cần người hướng dẫn, thiết bị an toàn.'
        discussion = field('Góc thảo luận cùng Cha mẹ')
        questions.append({'id': int(qchunks[j]), 'scenario': scenario, 'options': options,
                          'answer': answer, 'explanation': field('Lời giải thích cho trẻ'),
                          'discussion': discussion, 'safety': note,
                          'optionExplanations': {k: explanation(v, options[answer]) for k,v in options.items() if k != answer}})
    assert len(questions) == 10, week
    weeks.append({'id': week, 'title': chunks[i+1], 'goal': roadmap.get(week, {}).get('goal',''), 'questions': questions})
source2 = Path('/workspace/attachments/25ba10e9-0887-4d0c-a3bb-13372e9a7f1a/Pasted text.txt')
text2 = source2.read_text()
chunks2 = re.split(r'^Tuần (\d+): (.+)$', text2, flags=re.M)
for i in range(1, len(chunks2), 3):
    week = int(chunks2[i])
    qchunks = re.split(r'^Câu hỏi (\d+): (.+)$', chunks2[i+2], flags=re.M)
    questions=[]
    for j in range(1, len(qchunks), 3):
        block=qchunks[j+2]
        def field2(name):
            m=re.search(r'^\* '+re.escape(name)+r':\s*(.*)$',block,re.M)
            assert m,(week,qchunks[j],name)
            return m[1].strip()
        options=dict(re.findall(r'^\* ([ABCD])\. (.+)$',block,re.M))
        answer=field2('Đáp án đúng')
        assert set(options)==set('ABCD') and answer in options
        questions.append({'id':int(qchunks[j]),'scenario':qchunks[j+1], 'options':options,
                          'answer':answer,'explanation':field2('Giải thích cho bé'),
                          'discussion':field2('Đồng hành cùng cha mẹ'),'safety':None,
                          'optionExplanations':{k:explanation(v,options[answer]) for k,v in options.items() if k!=answer}})
    assert len(questions)==10, week
    # The actual week titles in volume 2 replace the provisional roadmap in volume 1.
    matrix=re.search(r'^'+str(week)+r'\t[^\t]+\t([^\t]+)',text2,re.M)
    weeks.append({'id':week,'title':chunks2[i+1],'goal':matrix[1] if matrix else '', 'questions':questions})
summary = Path('/workspace/attachments/9ea69160-d9a9-4c7b-9b19-a092838bc13b/Pasted text.txt').read_text()
portraits=[]
for line in summary.splitlines():
    m=re.match(r'^(\d+)\t([^\t]+)\t([^\t]+)\t',line)
    if m: portraits.append({'id':int(m[1]),'title':m[2],'criterion':m[3]})
assert len(portraits)==16
assert [w['id'] for w in weeks]==list(range(1,53))

editorial=json.loads((ROOT/'data/editorial-notes.json').read_text())
for w in weeks:
    for q in w['questions']:
        notes=editorial.get(f"{w['id']}.{q['id']}",{})
        q['sourceAnswer']=q['answer']
        if notes.get('overrideAnswer'): q['answer']=notes['overrideAnswer']
        if notes.get('overrideExplanation'):
            q['sourceExplanation']=q['explanation']
            q['explanation']=notes['overrideExplanation']
        q['validAlternatives']=notes.get('validAlternatives',{})
        q['acceptedAnswers']=list(dict.fromkeys([q['answer'],*q['validAlternatives']]))
        if notes.get('safety'):q['safety']=notes['safety']
        if q['answer']!=q['sourceAnswer']:
            q['optionExplanations']={k:explanation(v,q['options'][q['answer']]) for k,v in q['options'].items() if k!=q['answer']}
            q['optionExplanations'][q['sourceAnswer']]='Con không nên đến gần mép hồ hoặc tự dùng cành cây khều đồ vì có nguy cơ rơi xuống nước. Hãy giữ khoảng cách an toàn và gọi người lớn.'
        if w['id']==7 and q['id']==10:
            q['optionExplanations']['C']='Nỗ lực của con rất đáng ghi nhận. Đồng thời, bài học này mời con nhận ra sự hỗ trợ của thầy cô và cha mẹ; lời cảm ơn giúp con ghi nhận những đóng góp ấy.'
data = {'weeks': weeks, 'guide': chunks[0], 'sourceText': text+'\n\n'+text2,
        'yearSummary':summary,'portraits':portraits,
        'availableWeeks': 52, 'questionCount': sum(len(w['questions']) for w in weeks),
        'audit':{'review':(ROOT/'content-review.md').read_text()}}
(ROOT/'data/content.json').write_text(json.dumps(data, ensure_ascii=False, indent=2))
(ROOT/'data/tai-lieu-goc.txt').write_text(text+'\n\n'+text2+'\n\n'+summary)
print(f"Prepared {len(weeks)} weeks / {data['questionCount']} questions; source retained in full.")
