const T = require('./lib2.js');
const md = (...l) => l.join('\n');
const items=(c,t)=>T.parseSections(c).find(s=>s.title===t).items;
// D2: 두 번째 "운동"을 High로 드래그 → Cmd+Z
const c = md('## 🔥 High','- [ ] h','','## 🟡 Medium','- [ ] 운동','  - [ ] 스트레칭','- [ ] 기타','- [ ] 운동','  - [ ] 러닝 5km','','## 🟢 Low','');
const lines=c.split('\n');
const second = items(c,'🟡 Medium').filter(i=>i.text==='운동')[1];
const r0=T.extractBlock(lines, second.lineIndex);
const orig=lines.slice(r0.start,r0.end+1), after={lineIndex:r0.start-1, raw:lines[r0.start-1]};
const moved=T.opMove(second,{sectionKey:'high',beforeItem:null,intoItem:null})(c);
console.log('--- 이동 후\n'+moved);
const undone=T.opUndoMove(second.text, orig, after)(moved);
console.log('--- Cmd+Z 후\n'+undone);
// D2 add undo: 기존 "우유"가 있는데 같은 글 추가가 실패(drop)한 뒤 Cmd+Z
const c2=md('## 🔥 High','- [ ] 우유','','## 🟡 Medium','');
try{console.log('--- 추가 실패 뒤 Cmd+Z\n'+T.opActiveRemoveAppended('high',['우유'])(c2));}catch(e){console.log('gone',e.message)}
// R4 split 20개 제한
const many=Array.from({length:25},(_,i)=>'항목'+(i+1)).join('\n');
console.log('split 개수', T.splitPastedLines(many).length, '| "2024. 계획\\n둘" →', JSON.stringify(T.splitPastedLines('2024. 계획\n둘')));
