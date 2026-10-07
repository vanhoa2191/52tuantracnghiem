from pathlib import Path
from collections import defaultdict, Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json, re, unicodedata
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'dist/content.json').read_text())
questions=[dict(q,week=w['id']) for w in data['weeks'] for q in w['questions']]
def norm(s):
    s=unicodedata.normalize('NFKC',s).casefold()
    return ' '.join(re.findall(r'\w+',s))
exact=defaultdict(list)
full=defaultdict(list)
for q in questions:
    exact[norm(q['scenario'])].append(f"{q['week']:02d}.{q['id']:02d}")
    full[norm(q['scenario']+' '+' '.join(q['options'].values()))].append(f"{q['week']:02d}.{q['id']:02d}")
vectors=TfidfVectorizer(analyzer='char_wb',ngram_range=(3,5),min_df=2).fit_transform([norm(q['scenario']) for q in questions])
similarity=cosine_similarity(vectors)
pairs=[]
for i,a in enumerate(questions):
    for j in range(i+1,len(questions)):
        if similarity[i,j]>=.62:
            b=questions[j]
            pairs.append({'a':f"{a['week']:02d}.{a['id']:02d}",'b':f"{b['week']:02d}.{b['id']:02d}",
                          'similarity':round(float(similarity[i,j]),3),'scenarioA':a['scenario'],'scenarioB':b['scenario']})
pairs.sort(key=lambda p:p['similarity'],reverse=True)
audit={'totalWeeks':len(data['weeks']),'totalQuestions':len(questions),
       'exactScenarioGroups':[v for v in exact.values() if len(v)>1],
       'exactFullQuestionGroups':[v for v in full.values() if len(v)>1],
       'candidatePairs':pairs,'threshold':.62,
       'answerDistribution':dict(Counter(q['answer'] for q in questions)),
       'roadmapMismatch':list(range(29,40))}
(ROOT/'content-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in audit.items() if k!='candidatePairs'},ensure_ascii=False,indent=2))
print('Candidates:',len(pairs))
for p in pairs[:35]:
    print(p['a'],p['b'],p['similarity'], '\n ',p['scenarioA'],'\n ',p['scenarioB'])
