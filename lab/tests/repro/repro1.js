const T = require('./lib.js');
const md = (...l) => l.join('\n');
const c = md('## 🔥 High','- [ ] h','','## 🟡 Medium','- [ ] 운동','  - [ ] 스트레칭','- [ ] 기타','- [ ] 운동','  - [ ] 러닝 5km','','## 🟢 Low','');
const first = T.parseSections(c).find(s=>s.title==='🟡 Medium').items.find(i=>i.text==='운동');
console.log('item', JSON.stringify({li:first.lineIndex,ord:first.ordinal,sc:first.sameCount,sec:first.section,p:first.parentRaw}));
// 다른 기기가 첫 운동 블록을 먼저 지움(또는 우리 PUT이 반영됐는데 응답 유실 → 재적용 판정)
const after = c.replace('- [ ] 운동\n  - [ ] 스트레칭\n','');
try { const out = T.opDeleteBlock(first)(after); console.log('재적용 결과:\n'+out); } catch(e){ console.log('gone?', e.gone, e.message); }
// inbox
const ib = md('# Inbox','','- 우유','- 빵','- 우유','');
const [m1] = T.parseInbox(ib);
const landed = T.removeInboxLines([m1], ib, {strict:true});
try { const again = T.removeInboxLines([m1], landed, {strict:true}); console.log('inbox 재적용 변화?', again!==landed, JSON.stringify(again)); } catch(e){ console.log('inbox gone', e.gone); }
