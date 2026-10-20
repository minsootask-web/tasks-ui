const T = require('./lib2.js');
const md = (...l) => l.join('\n');
const items=(c,t)=>T.parseSections(c).find(s=>s.title===t).items;
const c = md('## 🔥 High','- [ ] 운동','  - [ ] 스트레칭','','## 🟡 Medium','- [ ] 기타','','## 🟢 Low','- [ ] 운동','  - [ ] 러닝 5km','- [ ] 사진','');
const lines=c.split('\n');
const low = items(c,'🟢 Low').find(i=>i.text==='운동');
const r0=T.extractBlock(lines, low.lineIndex);
const orig=lines.slice(r0.start,r0.end+1), after={lineIndex:r0.start-1, raw:lines[r0.start-1]};
const moved=T.opMove(low,{sectionKey:'medium',beforeItem:null,intoItem:null})(c);
console.log('--- Low 운동을 Medium으로\n'+moved);
console.log('--- Cmd+Z 후\n'+T.opUndoMove(low.text, orig, after)(moved));
// 글 고치기 되돌리기: "기타"를 "운동"으로 고침 → Cmd+Z
const e1=T.editLine(lines.indexOf('- [ ] 기타'),'운동',c);
console.log('--- 기타→운동 후 Cmd+Z\n'+T.opEditByText('운동','기타')(e1));
