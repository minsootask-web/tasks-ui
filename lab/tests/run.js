#!/usr/bin/env node
// tako 순수 함수 회귀 테스트(D10⑥) — 브라우저 없이 node로 실행
//
//   node lab/tests/run.js                 # lab/index.html 검사
//   node lab/tests/run.js index.html      # 본 서비스(이식 후)에도 같은 테스트
//
// index.html 안의 함수 정의를 "이름으로" 그대로 떼어 와 실행한다(복사본을 따로 두지 않음 → 코드가 바뀌면
// 테스트도 바로 그 코드를 검사). DOM·네트워크를 쓰지 않는 줄 계산·연산 함수만 대상.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const html = fs.readFileSync(target, 'utf8');

// ---- 정의 떼어 오기: function 이름(...) {...} 또는 const 이름 = ...; ----
function sliceStatement(src, start) {
  // start부터 문장 끝(최상위의 ';' 또는 function 본문의 닫는 '}')까지. 문자열·템플릿·정규식·주석을 건너뛴다
  let i = start, depth = 0, sawBrace = false;
  const isFn = /^(async\s+)?function\b/.test(src.slice(start, start + 20));
  let prevSig = '=';
  while (i < src.length) {
    const ch = src[i];
    const two = src.slice(i, i + 2);
    if (two === '//') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (two === '/*') { i = src.indexOf('*/', i) + 2; continue; }
    if (ch === '"' || ch === "'") {
      i++;
      while (i < src.length && src[i] !== ch) { if (src[i] === '\\') i++; i++; }
      i++; prevSig = 'a'; continue;
    }
    if (ch === '`') {
      i++;
      let d = 0;
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '$' && src[i + 1] === '{') { d++; i += 2; continue; }
        if (src[i] === '}' && d > 0) { d--; i++; continue; }
        if (src[i] === '`' && d === 0) break;
        i++;
      }
      i++; prevSig = 'a'; continue;
    }
    if (ch === '/' && /[=(,:[!&|?{};+\-*%<>~^\n]/.test(prevSig)) {
      // 정규식 리터럴
      i++;
      let inClass = false;
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '[') inClass = true;
        else if (src[i] === ']') inClass = false;
        else if (src[i] === '/' && !inClass) break;
        i++;
      }
      i++;
      while (/[a-z]/i.test(src[i])) i++;
      prevSig = 'a'; continue;
    }
    if ('([{'.includes(ch)) { depth++; if (ch === '{') sawBrace = true; }
    else if (')]}'.includes(ch)) {
      depth--;
      if (isFn && depth === 0 && ch === '}' && sawBrace) return src.slice(start, i + 1);
    } else if (ch === ';' && depth === 0 && !isFn) return src.slice(start, i + 1);
    if (!/\s/.test(ch)) prevSig = ch;
    else if (ch === '\n') prevSig = prevSig; // 줄바꿈은 신호를 바꾸지 않음
    i++;
  }
  throw new Error('문장 끝을 찾지 못함');
}
function grab(name) {
  const re = new RegExp(`^(?:async\\s+)?function\\s+${name}\\s*\\(|^const\\s+${name}\\s*=`, 'm');
  const m = re.exec(html);
  if (!m) return null; // 아직 옮기지 않은 묶음의 함수 → 그 함수를 쓰는 테스트는 "건너뜀"
  return sliceStatement(html, m.index);
}

const NAMES = [
  'esc', 'escAttr', 'linkHTML', 'linkify', 'highlightMeta',
  'normLine', 'getLineIndent', 'assertItemLine', 'extractBlock', 'adjustBlockIndent', 'lineContext',
  'locateGone', 'inboxKey', 'INBOX_LOC', 'blockEndAt', 'lineSig', 'lineFp', 'locate', 'resolveLineIndex',
  'parseSections', 'sectionHeaderIndex', 'ensureSectionHeader', 'sectionInsertAfter', 'insertIntoSection',
  'toggleAt', 'appendToSection', 'editLine', 'deleteAt', 'moveLineToPosition', 'moveLineToSection',
  'childInsertIndex', 'restoreBlockInto',
  'lineOf', 'opToggle', 'opDeleteBlock', 'opDeleteBlocks', 'opMove', 'opAddChild',
  'deferred', 'createStore', 'removedVerdict', 'countKeyLines', 'opInboxRemove', 'opArchiveRemove',
  'countExactLines', 'withApplied', 'opAppend', 'opAppendMany', 'removeByFps', 'opActiveRemoveRec', 'opInboxRemoveRec',
  'opInboxAppend', 'opInboxInsert', 'recFps', 'opRestore', 'opActiveReinsert',
  'undoGone', 'anchorAt', 'anchorIndex', 'recordMove', 'opEdit', 'opEditBack', 'opEditMove', 'opUndoMove',
  'parseInbox', 'inboxTarget', 'resolveInboxLine', 'removeInboxLines',
  'memoCol', 'memoOrder', 'memosAfterMove',
  'splitPastedLines',
];
const found = NAMES.map((n) => [n, grab(n)]).filter(([, src]) => src);
const missing = NAMES.filter((n) => !found.some(([f]) => f === n));
const sources = found.map(([, src]) => src).join('\n\n');
const sandbox = {
  console: { log: console.log, warn() {}, error() {} },
  SECTION_KEYS: { high: '🔥 High', medium: '🟡 Medium', low: '🟢 Low' },
  MEMO_MAX_COLS: 3,
  state: { content: '', inboxContent: '' },
  // createStore가 쓰는 화면·네트워크 자리(테스트마다 ghGet·ghPut을 바꿔 끼움)
  syncStatus: { errors: {}, retry: {}, start() {}, ok() {}, end() {}, fail() {} },
  renderSync() {}, handleUnauthorized() {},
  notify: { error() {}, info() {}, undo() {} },
  friendlyError: (e, f) => (e && e.userMessage) || f || '저장하지 못했어요',
  setTimeout, clearTimeout, Promise,
};
vm.createContext(sandbox);
vm.runInContext(sources + '\n' + found.map(([n]) => `globalThis.${n} = ${n};`).join('\n'), sandbox, { filename: 'extracted-from-index.html' });
const T = sandbox;

// ---- 아주 작은 테스트 도구 ----
let pass = 0, fail = 0, skip = 0;
const queue = [];
function test(name, fn) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log(`  ok  ${name}`); }
    catch (e) {
      const miss = missing.find((n) => e instanceof TypeError && new RegExp(`T\\.${n}\\b|${n} is not a function`).test(e.message));
      if (miss) { skip++; console.log(`  --  ${name} (건너뜀: ${miss} 없음)`); continue; }
      fail++; console.log(`  FAIL ${name}\n       ${e.message}`);
    }
  }
}
function eq(a, b, msg) {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error(`${msg || ''}\n       기대: ${B}\n       실제: ${A}`);
}
function throwsGone(fn) {
  try { fn(); } catch (e) { if (e.gone) return; throw e; }
  throw new Error('gone 예외를 기대했지만 통과함');
}
const md = (...lines) => lines.join('\n');
const items = (content, title) => T.parseSections(content).find((s) => s.title === title).items;
const sectionLines = (content, key) => {
  const s = content.split('\n');
  const h = s.findIndex((l) => l === `## ${T.SECTION_KEYS[key]}`);
  let e = s.length;
  for (let i = h + 1; i < s.length; i++) if (s[i].startsWith('## ')) { e = i; break; }
  return s.slice(h + 1, e).filter((l) => l.trim());
};

console.log(`tako 순수 함수 테스트 — ${path.relative(process.cwd(), target)}`);

// ---------- QA 재현 시나리오 고정 ----------
const BASE = md('# Active', '', '## 🔥 High', '- [ ] 보고서 1', '- [ ] 보고서 2', '- [ ] 보고서 3', '',
  '## 🟡 Medium', '- [ ] 운동', '  - [ ] 스트레칭', '- [ ] 기타', '- [ ] 운동', '  - [ ] 러닝 5km', '', '## 🟢 Low', '- [ ] 사진', '');

test('R2: 같은 글 "운동" 둘 — 위쪽 줄이 밀려도 첫 번째 블록만 지움(러닝 5km 유지)', () => {
  const first = items(BASE, '🟡 Medium').find((i) => i.text === '운동');
  const shifted = BASE.replace('- [ ] 보고서 1\n- [ ] 보고서 2\n- [ ] 보고서 3\n', ''); // 봇 cmd_done
  const out = T.opDeleteBlock(first)(shifted);
  eq(sectionLines(out, 'medium'), ['- [ ] 기타', '- [ ] 운동', '  - [ ] 러닝 5km']);
});

test('R2: 같은 글 개수가 바뀌고 맥락으로도 못 고르면 추측하지 않고 gone', () => {
  const c = md('## 🟡 Medium', '- [ ] 같은글', '- [ ] 같은글', '');
  const second = items(c, '🟡 Medium')[1];
  const changed = md('## 🟡 Medium', '- [ ] 같은글', '- [ ] 끼어듦', '- [ ] 같은글', '- [ ] 같은글', '');
  throwsGone(() => T.opDeleteBlock({ ...second, lineIndex: 99 })(changed));
});

test('S4: 같은 글 "운동" 둘 중 첫째가 다른 기기에서 먼저 지워짐 → 다시 적용해도 둘째(러닝 5km)를 지우지 않고 gone', () => {
  const c = md('## 🔥 High', '- [ ] h', '', '## 🟡 Medium', '- [ ] 운동', '  - [ ] 스트레칭', '- [ ] 기타', '- [ ] 운동', '  - [ ] 러닝 5km', '', '## 🟢 Low', '');
  const first = items(c, '🟡 Medium').find((i) => i.text === '운동');
  const after = c.replace('- [ ] 운동\n  - [ ] 스트레칭\n', '');
  throwsGone(() => T.opDeleteBlock(first)(after));
  // 둘째를 지우는 것은(첫째가 먼저 사라졌어도) 앞뒤 줄·하위가 같아 그대로 찾음
  const second = items(c, '🟡 Medium').filter((i) => i.text === '운동')[1];
  eq(sectionLines(T.opDeleteBlock(second)(after), 'medium'), ['- [ ] 기타']);
});

test('locate: 같은 글이 하나뿐이면 다른 섹션으로 옮겨져 있어도 찾음 / 같은 글이 붙어 있고 개수가 바뀌면 gone', () => {
  const c = md('## 🔥 High', '- [ ] a', '', '## 🟡 Medium', '- [ ] 혼자', '');
  const it = items(c, '🟡 Medium')[0];
  const moved = md('## 🔥 High', '- [ ] a', '- [x] 혼자', '', '## 🟡 Medium', '');
  eq(T.locate(moved.split('\n'), it), 2);
  const d = md('## 🟡 Medium', '- [ ] 우유', '- [ ] 우유', '');
  const second = items(d, '🟡 Medium')[1];
  throwsGone(() => T.locate(md('## 🟡 Medium', '- [ ] 우유', '- [ ] 우유', '- [ ] 우유', '').split('\n'), second));
});

test('Q2: 서로 다른 섹션의 같은 글 부모 — 줄이 밀려도 Low 쪽만 지움', () => {
  const c = md('## 🔥 High', '- [ ] h', '', '## 🟡 Medium', '- [ ] 회의', '  - [ ] 첫째 하위', '', '## 🟢 Low', '- [ ] 회의', '  - [ ] 둘째 하위', '');
  const low = items(c, '🟢 Low').find((i) => i.text === '회의');
  const shifted = c.replace('- [ ] h\n', '- [ ] a\n- [ ] b\n- [ ] c\n- [ ] d\n- [ ] h\n');
  const out = T.opDeleteBlock(low)(shifted);
  eq(sectionLines(out, 'medium'), ['- [ ] 회의', '  - [ ] 첫째 하위']);
  eq(sectionLines(out, 'low'), []);
});

test('Q1: 완료 일괄 보관 — 같은 글 "운동" 둘을 서로 다른 줄로 배정, "기타"는 남김', () => {
  const c = md('## 🔥 High', '- [ ] h', '', '## 🟡 Medium', '- [x] 운동', '- [ ] 기타', '- [x] 운동', '');
  const targets = items(c, '🟡 Medium').filter((i) => i.checked);
  const shifted = c.replace('- [ ] h\n', '- [ ] h\n- [ ] 새 줄\n');
  const out = T.opDeleteBlocks(targets)(shifted);
  eq(sectionLines(out, 'medium'), ['- [ ] 기타']);
});

test('R8: Inbox "우유" 둘 — 첫째를 뺀 뒤 둘째(줄 번호 밀림)를 빼도 "빵"은 남음', () => {
  const c = md('# Inbox', '', '- 우유', '- 빵', '- 우유', '');
  const [m1, , m2] = T.parseInbox(c);
  const after1 = T.removeInboxLines([m1], c, { strict: true });
  const after2 = T.removeInboxLines([m2], after1, { strict: true });
  eq(T.parseInbox(after2).map((i) => i.text), ['빵']);
  eq(T.parseInbox(c).map((i) => i.key.split('\u0000')[1]), ['1', '1', '2']);
});

test('S3: Inbox "우유"·"빵"·"우유" — 첫째 우유 제거가 이미 반영된 내용에 다시 적용하면 둘째 우유를 지우지 않고 gone', () => {
  const ib = md('# Inbox', '', '- 우유', '- 빵', '- 우유', '');
  const [m1] = T.parseInbox(ib);
  const landed = T.removeInboxLines([m1], ib, { strict: true });
  eq(T.parseInbox(landed).map((i) => i.text), ['빵', '우유']);
  throwsGone(() => T.removeInboxLines([m1], landed, { strict: true }));
});

test('Q14: 이미 다른 곳에서 정리된 Inbox 항목은 strict 제거에서 gone', () => {
  const c = md('- 빵', '');
  throwsGone(() => T.removeInboxLines([{ text: '우유', lineIdx: 0 }], c, { strict: true }));
});

test('R14: 링크 — & 문자 참조가 온전, 태그 이스케이프, 끝 마침표 제외, javascript: 미링크', () => {
  const a = T.highlightMeta('https://ex.com/?a=1&');
  if (!a.includes('href="https://ex.com/?a=1&amp;"')) throw new Error(a);
  const b = T.highlightMeta('x <b>https://ex.com/a</b>');
  if (!b.startsWith('x &lt;b&gt;<a ') || !b.endsWith('</a>&lt;/b&gt;')) throw new Error(b);
  const c = T.highlightMeta('see https://github.com/a/b.');
  if (!c.endsWith('</a>.')) throw new Error(c);
  const d = T.highlightMeta('javascript:alert(1) <i>');
  if (d.includes('<a ')) throw new Error(d);
  const e = T.highlightMeta('치과 (10/23) https://n.com');
  if (!e.includes('<span class="meta-inline">(10/23)</span>') || !e.includes('>n.com</a>')) throw new Error(e);
});

test('S1: Low "운동"을 Medium으로 옮긴 뒤 되돌리기 — High "운동"+스트레칭은 그대로, 러닝 5km는 Low에만', () => {
  const c = md('## 🔥 High', '- [ ] 운동', '  - [ ] 스트레칭', '', '## 🟡 Medium', '- [ ] 기타', '', '## 🟢 Low', '- [ ] 운동', '  - [ ] 러닝 5km', '- [ ] 사진', '');
  const low = items(c, '🟢 Low').find((i) => i.text === '운동');
  const rec = {};
  const moved = T.opMove(low, { sectionKey: 'medium', beforeItem: null, intoItem: null }, rec)(c);
  eq(sectionLines(moved, 'medium'), ['- [ ] 기타', '- [ ] 운동', '  - [ ] 러닝 5km']);
  eq(T.opUndoMove(rec)(moved), c);
  // 옮긴 뒤 하위를 체크했어도 되돌리면 지금 모습 그대로 원래 자리로(옛 사본으로 덮지 않음)
  const checked = moved.replace('  - [ ] 러닝 5km', '  - [x] 러닝 5km');
  eq(sectionLines(T.opUndoMove(rec)(checked), 'low'), ['- [ ] 운동', '  - [x] 러닝 5km', '- [ ] 사진']);
});

test('S1: Medium 두 "운동" 중 둘째를 High로 → 되돌리기는 그 블록만 원래 자리(기타 다음)로', () => {
  const c = md('## 🔥 High', '- [ ] h', '', '## 🟡 Medium', '- [ ] 운동', '  - [ ] 스트레칭', '- [ ] 기타', '- [ ] 운동', '  - [ ] 러닝 5km', '', '## 🟢 Low', '');
  const second = items(c, '🟡 Medium').filter((i) => i.text === '운동')[1];
  const rec = {};
  const moved = T.opMove(second, { sectionKey: 'high', beforeItem: null, intoItem: null }, rec)(c);
  eq(T.opUndoMove(rec)(moved), c);
});

test('S1: 우선순위+글 고치기 되돌리기 — 같은 글이 다른 섹션에 있어도 옮긴 줄만 원래 자리·원래 글로', () => {
  const c = md('## 🔥 High', '- [ ] 운동', '', '## 🟡 Medium', '- [ ] a', '- [ ] 기타', '- [ ] b', '', '## 🟢 Low', '');
  const it = items(c, '🟡 Medium').find((i) => i.text === '기타');
  const rec = {};
  const out = T.opEditMove(it, '운동', 'high', rec)(c);
  eq(sectionLines(out, 'high'), ['- [ ] 운동', '- [ ] 운동']);
  eq(T.opUndoMove(rec, { backText: '기타' })(out), c);
});

test('S13: "기타"를 "운동"으로 고친 뒤 되돌리기 — High "운동"은 그대로, Medium 줄만 "기타"로', () => {
  const c = md('## 🔥 High', '- [ ] 운동', '', '## 🟡 Medium', '- [ ] 기타', '');
  const it = items(c, '🟡 Medium')[0];
  const rec = {};
  const e1 = T.opEdit(it, '운동', rec)(c);
  eq(T.opEditBack(rec, '기타')(e1), c);
  // 고친 줄이 그새 사라졌으면 다른 같은 글 줄을 고치지 않고 gone
  throwsGone(() => T.opEditBack(rec, '기타')(md('## 🔥 High', '- [ ] 운동', '', '## 🟡 Medium', '')));
});

test('S12: 추가 되돌리기는 넣은 그 줄만 — 같은 섹션의 원래 "우유"(하위 포함)는 그대로', () => {
  const c = md('## 🔥 High', '- [ ] 우유', '  - [ ] 저지방', '- [ ] 빵', '', '## 🟡 Medium', '');
  const rec = {};
  const added = T.opAppend('high', '우유', rec)(c);
  eq(sectionLines(added, 'high'), ['- [ ] 우유', '  - [ ] 저지방', '- [ ] 빵', '- [ ] 우유']);
  eq(T.opActiveRemoveRec(rec)(added), c);
  // 추가가 저장되지 않아(실패) 넣은 줄이 없으면 아무것도 지우지 않고 gone
  throwsGone(() => T.opActiveRemoveRec(rec)(c));
});

test('S1·S12: Inbox→Task 분류 되돌리기·실패 되돌림 — Task에 원래 있던 같은 글은 남김', () => {
  const c = md('## 🔥 High', '- [ ] 보고서', '- [ ] 메일', '', '## 🟡 Medium', '');
  const rec = {};
  const moved = T.opAppendMany('high', ['보고서', '메일'], rec)(c);
  eq(T.opActiveRemoveRec(rec)(moved), c);
  const ib = md('# Inbox', '', '- 보고서', '- 빵', '');
  const r2 = {};
  const back = T.opInboxInsert([{ text: '보고서', lineIdx: 4 }], r2)(ib);
  eq(T.parseInbox(back).map((i) => i.text), ['보고서', '빵', '보고서']);
  eq(T.opInboxRemoveRec(r2)(back), ib);
});

test('보관 되돌리기: 원래 기준 줄 아래로, 기준 줄이 애매하면 섹션 끝(일반 복구 규칙)', () => {
  const c = md('## 🔥 High', '- [ ] a', '- [x] 끝냄', '- [ ] b', '', '## 🟡 Medium', '');
  const lines = c.split('\n');
  const mid = [...lines.slice(0, 2), ...lines.slice(3)];
  const pos = { block: ['- [x] 끝냄'], anchor: T.anchorAt(mid, 2) };
  const entry = { priority: 'high', block: ['- [x] 끝냄'] };
  eq(T.opActiveReinsert(entry, pos)(mid.join('\n')), c);
  const dup = md('## 🔥 High', '- [ ] a', '- [ ] a', '- [ ] b', '', '## 🟡 Medium', '');
  eq(sectionLines(T.opActiveReinsert(entry, pos)(dup), 'high'), ['- [ ] a', '- [ ] a', '- [ ] b', '- [x] 끝냄']);
});

// 가짜 원격(파일 하나). lost: PUT을 반영한 뒤 응답 대신 연결 끊김, offline: 요청이 닿지 않음
function fakeRemote(content) {
  const r = { content, sha: 's0', n: 0, lost: 0, offline: 0, getOffline: 0 };
  const netErr = () => Object.assign(new Error('Failed to fetch'), { network: true });
  T.ghGet = async () => { if (r.getOffline > 0) { r.getOffline--; throw netErr(); } return { sha: r.sha, content: r.content }; };
  T.ghPut = async (url, text, sha) => {
    if (r.offline > 0) { r.offline--; throw netErr(); }
    if (sha !== r.sha) throw Object.assign(new Error('409'), { code: 409 });
    r.content = text; r.sha = 's' + (++r.n);
    if (r.lost > 0) { r.lost--; throw netErr(); }
    return r.sha;
  };
  return r;
}
async function inboxStoreWith(content) {
  const st = T.createStore({ file: 'inbox', url: 'x', parse: (c) => c, serialize: (c) => c, missing: false });
  await st.reload();
  return st;
}

test('S3: Inbox 우유·빵·우유 — 첫째 우유 제거가 반영된 뒤 응답만 유실 → 반영으로 판정(둘째 우유 유지)', async () => {
  const ib = md('# Inbox', '', '- 우유', '- 빵', '- 우유', '');
  const r = fakeRemote(ib);
  const st = await inboxStoreWith(ib);
  const [m1] = T.parseInbox(ib);
  r.lost = 1;
  await st.commit(T.opInboxRemove([m1]));
  eq(T.parseInbox(r.content).map((i) => i.text), ['빵', '우유']);
  eq(st.view, r.content);
});

test('S3: 응답 유실 사이 다른 기기도 같은 글을 지움(개수가 기대와 다름) → 결과 모름(uncertain), 되돌리지 않음', async () => {
  const ib = md('# Inbox', '', '- 우유', '- 빵', '- 우유', '');
  const r = fakeRemote(ib);
  const st = await inboxStoreWith(ib);
  const [m1] = T.parseInbox(ib);
  const origPut = T.ghPut;
  T.ghPut = async (...a) => { const out = origPut(...a); await out.catch(() => {}); r.content = md('# Inbox', '', '- 빵', ''); r.sha = 'other'; return out; };
  r.lost = 1;
  let err = null;
  try { await st.commit(T.opInboxRemove([m1])); } catch (e) { err = e; }
  if (!err || !err.uncertain) throw new Error('uncertain 기대: ' + (err && err.message));
  if (!err.baseSha) throw new Error('baseSha 기록 기대');
});

test('R5: 연결이 끊겨 요청이 닿지 않았고 다시 받기도 실패 → uncertain', async () => {
  const ib = md('# Inbox', '', '- 우유', '');
  const r = fakeRemote(ib);
  const st = await inboxStoreWith(ib);
  r.offline = 1; r.getOffline = 1;
  let err = null;
  try { await st.commit(T.opInboxRemove(T.parseInbox(ib))); } catch (e) { err = e; }
  if (!err || !err.uncertain) throw new Error('uncertain 기대');
  eq(r.content, ib);
});

test('R5: 요청이 닿지 않았고 다시 받아 보니 그대로 → 미반영(일반 실패, 되돌림 가능)', async () => {
  const ib = md('# Inbox', '', '- 우유', '- 우유', '');
  const r = fakeRemote(ib);
  const st = await inboxStoreWith(ib);
  r.offline = 1;
  let err = null;
  try { await st.commit(T.opInboxRemove([T.parseInbox(ib)[0]])); } catch (e) { err = e; }
  if (!err || err.uncertain) throw new Error('uncertain이 아닌 실패 기대');
  eq(T.opDeleteBlock({ raw: '- [ ] a', lineIndex: 1 }).isApplied('## H\n', '## H\n- [ ] a\n'), true);
});

// ---------- 핵심 연산 ----------
test('토글: 체크/해제가 그 줄만 바꿈, 하위·형식 유지', () => {
  const c = md('## 🔥 High', '- [ ] a', '  - [ ] b', '');
  const a = items(c, '🔥 High')[0];
  const out = T.opToggle(a, true)(c);
  eq(out, md('## 🔥 High', '- [x] a', '  - [ ] b', ''));
  eq(T.opToggle(a, false)(out), c);
});

test('추가: 섹션 끝에 한 줄, 줄바꿈이 들어와도 한 줄로(R4 방어)', () => {
  const c = md('## 🔥 High', '- [ ] a', '', '## 🟡 Medium', '');
  eq(sectionLines(T.appendToSection('high', '줄1\n줄2', c), 'high'), ['- [ ] a', '- [ ] 줄1 줄2']);
  eq(T.splitPastedLines('회의 준비\n- 자료 출력\n\n2. [ ] 셋째'), ['회의 준비', '자료 출력', '셋째']);
});

test('이동: 다른 섹션으로·하위로 넣기', () => {
  const c = md('## 🔥 High', '- [ ] a', '', '## 🟢 Low', '- [ ] x', '- [ ] y', '');
  const y = items(c, '🟢 Low').find((i) => i.text === 'y');
  const lines = c.split('\n');
  const toHigh = T.opMove(y, { sectionKey: 'high', beforeItem: null, intoItem: null })(c);
  eq(sectionLines(toHigh, 'high'), ['- [ ] a', '- [ ] y']);
  const xIdx = lines.indexOf('- [ ] x');
  const into = T.opMove(y, { sectionKey: 'low', intoItem: { lineIndex: xIdx, raw: lines[xIdx] } })(c);
  eq(sectionLines(into, 'low'), ['- [ ] x', '  - [ ] y']);
});

test('보관·복구: 하위 항목은 부모 아래로 복구(A6), 부모가 없으면 상위로', () => {
  const c = md('## 🔥 High', '- [ ] 부모', '  - [ ] 다른 하위', '', '## 🟡 Medium', '');
  const lines = c.split('\n');
  T.restoreBlockInto(lines, { priority: 'high', parent: '부모', block: ['- [ ] 돌아온 하위'] });
  eq(sectionLines(lines.join('\n'), 'high'), ['- [ ] 부모', '  - [ ] 다른 하위', '  - [ ] 돌아온 하위']);
  const l2 = md('## 🔥 High', '- [ ] 남', '').split('\n');
  T.restoreBlockInto(l2, { priority: 'high', parent: '없는 부모', block: ['- [ ] 고아'] });
  eq(sectionLines(l2.join('\n'), 'high'), ['- [ ] 남', '- [ ] 고아']);
  const parent = items(c, '🔥 High')[0];
  eq(sectionLines(T.opDeleteBlock(parent)(c), 'high'), []);
});

test('하위 추가: 섹션 마지막 항목이어도 빈 줄 앞에(B-6)', () => {
  const c = md('## 🔥 High', '- [ ] 마지막', '', '## 🟡 Medium', '');
  const p = items(c, '🔥 High')[0];
  eq(T.opAddChild(p, '하위')(c), md('## 🔥 High', '- [ ] 마지막', '  - [ ] 하위', '', '## 🟡 Medium', ''));
});

test('메모 열(A5): 모바일 2열에서 옮겨도 PC 3번째 열(col 2) 메모는 그대로', () => {
  const memos = [
    { id: 'm1', col: 0, order: 0 }, { id: 'm2', col: 1, order: 0 },
    { id: 'm3', col: 2, order: 0 }, { id: 'm4', col: 0, order: 1 },
  ];
  const out = T.memosAfterMove(memos, memos[3], 1, 2, 2);
  eq(out.find((m) => m.id === 'm3'), { id: 'm3', col: 2, order: 0 });
  eq(out.find((m) => m.id === 'm4').col, 1);
  const pc = T.memosAfterMove(memos, memos[0], 2, 1, 3);
  eq(pc.filter((m) => m.col === 2).map((m) => m.id), ['m3', 'm1']);
});

runAll().then(() => {
  if (missing.length) console.log(`\n(이 파일에 없는 함수: ${missing.join(', ')})`);
  console.log(`\n${pass} 통과, ${fail} 실패${skip ? `, ${skip} 건너뜀` : ''}`);
  process.exit(fail ? 1 : 0);
});
