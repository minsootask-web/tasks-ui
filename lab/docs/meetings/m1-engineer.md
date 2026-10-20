# 1차 회의 — 프론트엔드 엔지니어 의견서

- 작성: 프론트엔드 엔지니어 · 2026-10-20
- 근거: `lab/index.html` 전체(3,065줄) 정독, `lab/mock-github.js`, `tasks-bot/api/webhook.py`(봇이 쓰는 형식 확인), `tasks-data/*.md|json` 실데이터 형식
- 줄번호는 모두 `lab/index.html` 기준
- 관점: ① 데이터 무결성 ② 구현 난이도·회귀 위험 ③ 본 서비스 `index.html`로 **항목별로 골라 옮기기 쉬운 구조**

---

## 0. 먼저 공유할 사실 (감사에 없던 것 포함)

### 0-1. 형식 호환 제약 (봇·Skill과 같이 쓰는 파일)
| 파일 | 다른 작성자 | 지켜야 할 것 |
|---|---|---|
| `active.md` | 봇 `cmd_done`(keyword 포함 줄 삭제 → done.md), Skill `/tasks`(inbox→active 정리) | 섹션 헤더 문자열 `## 🔥 High` / `## 🟡 Medium` / `## 🟢 Low`(`SECTION_KEYS` 718) **절대 변경 금지**. 항목은 `- [ ] ` / `- [x] ` + 2칸 들여쓰기. ID·HTML 주석 같은 숨은 표시를 넣지 않는다(봇 `cmd_list`가 원문을 그대로 메신저로 보냄) |
| `inbox.md` | 봇 `cmd_add`/`cmd_inbox_save`가 `rstrip() + "\n- text\n"`로 **끝에 추가** | `- text` 한 줄 형식 유지. 앱이 줄 번호로 지우면 봇이 그 사이 추가한 경우 409 → 지금은 그대로 실패 |
| `memos.json` | 봇 `cmd_memo_add`: **저장된 col(0~2, max_cols=3) 기준** 가장 짧은 열 맨 위, 같은 열 `order + 1` | col은 반드시 0~2의 "PC 기준" 값으로 저장(A5와 직결). order는 숫자면 되므로 소수(분수 순서)도 봇과 호환(Python `order + 1` 동작) |
| `archive.json` | 앱만 씀 | 필드 추가는 안전(읽는 쪽이 앱뿐). 기존 필드 의미는 유지 |

→ 결론: **모든 개선은 "파일 형식 불변, 화면 표시만 변경"** 이 원칙. 형식을 건드리는 항목은 A5(col 의미 고정)·A6(archive 필드 추가) 둘뿐이고 둘 다 하위 호환.

### 0-2. 감사에 없던 유실 버그 2건 (A3과 같은 뿌리)
1. **A3b — 저장 중 체크가 사라짐.** `processComposerQueue`(2872)·드래그·시트 저장은 `ghSave`(991)를 `keepLocalState` 없이 호출 → 성공 시 `state.content = mutated`(1013). `mutated`는 작업 시작 시점의 `state.content`로 만든 것이라, PUT이 날아가는 350ms+ 사이에 체크한 내용이 **로컬에서 덮여 사라지고**, 400ms 뒤 `flushToggles`의 스냅샷에도 없음. 재현: 컴포저로 추가 직후 0.3초 안에 다른 항목 체크.
2. **A3c — 큐 밖에서 도는 active.md 쓰기.** `serializeActive`(1168) 밖에 있는 것: `flushToggles`(2434), `safeMutate` 경유 `onAdd`/`onEdit`/시트 편집+이동(2455-2469, 2800), `onMoveToActive`/`onBulkMove`의 `ghLoad`+`ghSave`(1970-1972, 1984-1989), `onBulkArchiveDone`(2149), `onRestore`/`onBulkRestore`/`undoArchive`의 `ghLoad`(1613, 1534, 2159). 특히 **`ghLoad()`가 `state.content`를 원격으로 통째 덮어써서**(987) 아직 저장 안 된 체크가 사라짐. `ghSave`의 409 경로(1021-1024)도 `ghLoad`를 부르므로 같은 문제.

→ A3은 "visibilitychange 하나"가 아니라 **"로컬에 저장 안 된 변경이 있는데 원격으로 덮어쓰는 경로가 7곳"** 인 구조 문제. 공용 기반 F3(파일 스토어)로 한 번에 해결하는 것을 권장하고, 급하면 최소 수정(아래 A3-min)도 가능.

### 0-3. 409 처리 현황
- `ghSave`(active)만 409 시 재조회 후 `conflict` 예외. 재시도는 호출자 몫(컴포저만 1회 재시도, 2875-2880).
- `ghSaveInbox`/`ghSaveArchive`/`ghSaveMemos`(958, 894, 941)는 409 처리가 전혀 없음 → 봇이 inbox/memo를 쓴 직후 앱 저장은 "실패: PUT inbox 409".
- 모든 변경을 **"의도(intent) 기반 연산"** (줄 번호가 아니라 원문 줄·id·텍스트로 대상을 찾는 함수)으로 바꾸면, 409 때 최신본을 받아 같은 연산을 다시 적용(rebase)하고 재시도할 수 있다. 이미 `resolveLineIndex`(1143)가 그 역할의 절반을 하고 있어 기반이 있음.

---

## 1. 안건 A — 수정 설계

각 항목에 **[단독]**(공용 기반 없이 본 서비스에 바로 옮길 수 있는 최소안)과 **[기반]**(F1~F6 위에서의 정식안)을 구분했다. 기반 번호는 3장 참조.

### A1. 컴포저 추가 실패 시 글 유실 (2852-2892)
- 원인: `quickAdd`(2856)가 큐 넣기 전에 `input.value = ''`. 실패 시 2880·2882에서 토스트만.
- [단독] `composerQueue` 항목에 원문 보관 → 실패 시 `restoreComposerText(text)`:
  - 입력창이 비어 있으면 `input.value = text`, 아니면(그 사이 새 글을 쓰는 중) 덮지 않고 토스트 액션 "다시 시도"로 같은 `{text, pri}`를 큐에 재투입.
  - 오류 토스트 4초 이상, 문구 "추가하지 못했어요"(개발 용어 `PUT 500` 제거, `console.error`에만).
  - 큐에 실패 항목이 여러 개면 입력창 복원은 첫 1개, 나머지는 "n개 추가 못 함 · 다시 시도" 하나로 묶음.
- [기반] F3 + B9 적용 시: 행을 흐리게 즉시 추가 → 실패 시 행 제거 + 위와 동일 복원.
- 난이도 S · 회귀 위험 낮음(IME 잔여 문자 처리 `composerIme`(2850)와 충돌 주의: 복원은 `compositionend` 이후 실행되도록 `requestAnimationFrame`으로 미룸).

### A2. 시트를 먼저 닫고 저장 (2768-2813, 2815-2825)
- 원인: `sheetSave` 2772 `hideSheet()` 후 `onAdd/onEdit/onAddToInbox` 호출, 이 함수들은 오류를 삼키고(`safeMutate` 2393-2401) 결과를 돌려주지 않음.
- [단독] (권장: "성공 후 닫기")
  1. `safeMutate`·`onAddToInbox`가 `true/false`를 반환하도록 변경(호출부 영향: `onEdit`, 드래그 `onDragEnd` 2663 — 반환값 무시해도 무해).
  2. `sheetSave`를 `async`로: 저장 버튼 `disabled` + 라벨 "저장 중…" → `await` → 성공 시 `hideSheet()`, 실패 시 시트 유지 + 시트 안 오류 한 줄(토스트는 시트 뒤에 깔려 잘 안 보임).
  3. Esc/스크림 클릭(2752, 2941)으로 닫는 경우 저장 중이면 무시.
- [기반] B9(전부 낙관적)을 채택하면 반대로 "즉시 닫고, 실패 시 `reopenSheet(snapshot)`"이 일관됨. snapshot = `{mode, text, pri, editingItem}`.
- 참고: 편집+이동(2800-2808)은 producer 안에서 `state.content`를 직접 바꿔서(2803) 실패 시 로컬이 원격과 어긋난 채 남음 → `editLine`과 `moveLineToSection`을 순수 함수(lines 입력)로 합성해 `state`를 건드리지 않게.
- 난이도 S · 위험 낮음.

### A3. 체크 직후 앱 전환 시 체크 유실 (2405-2453, 3012-3014, 3033-3052) + A3b·A3c
**flush 전략 (3단)**
1. **숨겨질 때 즉시 저장**: `visibilitychange`에서 `document.hidden === true`이면 디바운스 타이머를 취소하고 바로 flush. `pagehide`에도 동일. 이때 PUT은 `fetch(..., { keepalive: true })`(본문 64KB 한도 — 현재 active.md는 수 KB라 충분, 초과 시 일반 fetch로 폴백).
2. **돌아올 때는 flush가 끝난 뒤 load**: `refresh()` 첫 줄에 `await flushAll()`. `flushAll` = 모든 파일의 디바운스 타이머 즉시 실행 + 각 파일 큐가 빌 때까지 대기.
3. **load가 로컬 미저장 변경을 지우지 않게**: flush가 실패했거나 아직 대기 중인 변경이 있으면, 원격본을 받은 뒤 그 위에 대기 중 변경을 **다시 적용**(rebase)해서 화면을 그림. 덮어쓰지 않음.

**[단독] A3-min (S, F3 없이 옮길 수 있는 최소안)**
- `toggleSync`(2408)에 `ops: Map<normLine(raw), checked>`와 `idle: Promise` 추가. `onToggle`(2410)에서 ops 기록.
- `flushToggles`를 `serializeActive(...)` 안으로 이동(A3c 중 토글 부분 해결). 저장 내용은 "현재 `state.content`"가 아니라 **"최신 원격본 + ops 재적용"**: 409면 `ghLoad` 후 ops를 `resolveLineIndex`로 다시 적용해 1회 재시도.
- `refresh()`(3033): `await flushTogglesNow()` → 실패 시 ops를 남긴 채 load 후 ops 재적용 → render.
- `visibilitychange` hidden 분기 추가(3012).
- 한계: A3b(다른 저장이 로컬을 덮음)는 `ghSave`의 1013줄을 "성공 시 sha만 갱신하고, 로컬은 `mutated`에 아직 저장 안 된 ops를 재적용한 값으로" 바꿔야 해결 → 이것까지 하면 사실상 F3의 축소판.

**[기반] F3 적용 시 (권장)**: 토글은 `stores.active.apply(opToggle(raw, checked), { debounce: 400 })` 한 줄. 화면은 늘 `store.view = base + pending ops`로 그리므로, `ghLoad`/409/refresh는 `base`만 바꾸고 pending은 자동 재적용 → 7개 경로가 구조적으로 사라짐.

**낙관적 업데이트와 `serializeActive` 큐의 관계 (정리)**
- 현재: 낙관적 반영은 큐 **밖**에서 `state.content`를 직접 바꾸고(2423), 큐 안 작업은 실행 시점의 `state.content`를 읽어 저장(우연히 체크가 같이 저장됨) 하지만 성공 후 `state.content = mutated`로 **되감기** → A3b.
- 원칙: ① 화면 반영은 큐 밖에서 즉시(view 갱신) ② 네트워크 쓰기는 파일당 하나의 큐에서만 ③ 큐 안 작업은 `state.content`를 직접 읽지 않고 **`base`(마지막으로 확인된 원격본)에 pending 연산을 차례로 적용한 결과**를 PUT ④ 성공하면 `base = 저장본`, 저장된 연산만 pending에서 제거, 나머지는 view에 그대로 남음 ⑤ 409면 `base` 재조회 → 같은 연산 재적용 → 재시도(최대 2회) ⑥ 최종 실패면 pending 유지 + 저장 상태 "저장 못 함 · 다시 시도"(F2). 사용자가 "되돌리기"를 고르면 그때 pending 제거.
- 디바운스(400ms)는 "큐에 들어갈 PUT 횟수"를 줄이는 장치로 스토어 안에 둔다. 연속 체크 5번 = PUT 1번 유지(감사의 "유지해야 할 점 2").

- 난이도: A3-min S / F3 포함 L · 위험: F3는 active.md 쓰기 경로 전부를 바꾸므로 **회귀 위험 높음** → 3장의 테스트 시나리오를 lab mock으로 전부 돌린 뒤 옮김.

### A4. 두 파일 저장 중 뒤쪽 실패 → 같은 항목이 두 곳 (보상 전략)
**대상 함수 6쌍** (모두 "앞 파일에 추가 → 뒤 파일에서 제거" 순서임)
| 동작 | 함수 | 1단계(추가) | 2단계(제거) |
|---|---|---|---|
| Inbox→Task | `onMoveToActive` 1968, `onBulkMove` 1980 | active.md 추가 | inbox.md 줄 삭제 |
| Task 보관 | `archiveActiveTask` 1577, `onBulkArchiveDone` 2118 | archive.json 추가 | active.md 블록 삭제 |
| Inbox 보관 | `archiveInboxItem` 1598, `onBulkDelete` 1997 | archive.json 추가 | inbox.md 줄 삭제 |
| 복구 | `onRestore` 1610, `onBulkRestore` 1527, `undoArchive` 2156 | active/inbox 추가 | archive.json 제거 |

**원칙: "추가 먼저, 제거 나중" 순서는 그대로 유지한다.** 실패해도 결과가 "유실"이 아니라 "중복"이 되기 때문(무결성 측면에서 올바른 순서). 그 위에 보상을 얹는다.

**보상(rollback) 설계 — `runMove(steps)` 헬퍼 (F4)**
```js
// 각 단계 = { store, op, undoOp } — op/undoOp 모두 의도 기반(줄 번호 X)
async function runMove({ add, remove, label }) {
  await add.store.commit(add.op);            // 1단계: 409면 스토어가 rebase+재시도
  try {
    await remove.store.commit(remove.op);    // 2단계
  } catch (e2) {
    try {
      await add.store.commit(add.undoOp);    // 보상: 1단계 되돌리기
      notify.error(`${label}하지 못했어요`, { retry: () => runMove(...) });
    } catch (e3) {
      // 보상도 실패 = 지금 두 곳에 있음. 숨기지 않고 알린다.
      pendingMoves.save({ add, remove });    // localStorage 저널
      notify.error('같은 항목이 두 곳에 있어요', { retry: () => resumeMove(...) });
    }
  }
}
```
- **보상 연산(undoOp)을 정확하게 만들 수 있는 이유**
  - archive.json: 추가한 entry의 `id`로 제거 → 정확.
  - active.md: 추가한 블록의 첫 줄 원문(`- [ ] text`)을 **대상 섹션 안에서 뒤에서부터** 찾아 블록째 삭제(`insertIntoSection`이 섹션 끝에 넣으므로). 같은 원문이 이미 있던 경우를 위해 1단계 직후 "추가된 줄 위치 힌트"를 받아 `resolveLineIndex`의 기준점으로 씀.
  - inbox.md: `- text` 줄을 끝에서부터 찾아 1개 삭제.
- **2단계 제거도 의도 기반으로**: `removeInboxLine(item.lineIdx)`(1043)는 줄 번호 기반이라 봇이 사이에 줄을 추가하면 409 → 재시도 시 엉뚱한 줄 삭제 위험. `removeInboxLineByText(content, text, hintIdx)`로 교체(가까운 줄부터 탐색, 없으면 "이미 지워짐"으로 성공 처리 → 재시도가 멱등).
- **재개 저널(선택, S)**: 보상까지 실패한 경우 `localStorage['tako_pending_moves']`에 `{id, add, remove}` 저장 → 다음 실행·refresh 때 2단계만 다시 시도(2단계가 멱등이므로 안전). 화면 문구는 쉬운 말 한 줄.
- **배치(`onBulkMove` 등)**: 1단계 n개를 한 번에 추가, 2단계 n줄을 한 번에 제거하는 현재 구조 유지(PUT 2번). 보상도 n개 일괄.
- **대안 검토 — Git Data API 원자 커밋**: blob→tree→commit→ref PATCH로 두 파일을 한 커밋에 쓰면 진짜 원자성. 하지만 API 호출 5~6회(느림), 커밋 후 파일별 sha 재조회 필요, `mock-github.js`가 미지원, 봇과의 동시성은 ref 단위 충돌로 오히려 잦아짐 → **비권장**(L).
- **A8과의 관계**: 이동 중인 행은 F3 view에서 "이동 중" 상태로 표시(흐림·버튼 비활성)되므로 연타로 같은 이동이 두 번 들어가지 않음.
- 난이도: F3 위에서 M(헬퍼 S + 6쌍 치환) · 위험 중(복구·보관 경로 전부 영향, 시나리오 테스트 필수).

### A5. Memo 모바일 2열 드래그가 PC 3열 배치를 영구 변경 (1684-1705, 1822-1859, 1910-1940)
- 원칙: **저장 col은 항상 0~2(PC·봇 기준), 화면 열 수는 그릴 때만 적용.** `displayCol = min(col, cols-1)`(1693은 이미 이렇게 그림 — 문제는 저장 쪽).
- `onMemoDragEnd`(1834-1851) 재작성: 전체를 다시 번호 매기지 말고 **옮긴 메모 1개만** col·order를 바꾼다.
  - 저장 col: 놓은 화면 열 `c`가 마지막 열이 아니면 `c`. 마지막 열(모바일 col 1 = 원래 1+2 합쳐진 열)이면 원래 col이 `≥ c`일 때 원래 col 유지, 아니면 `c`.
  - order: 화면상 바로 위·아래 메모의 order 중간값(분수 순서, 예: 위 2·아래 3 → 2.5). 맨 위면 `아래 - 1`, 맨 아래면 `위 + 1`. 다른 메모는 건드리지 않음 → PC 배치 보존, 봇과 동시 수정 시 충돌 범위도 최소.
  - 소수점이 너무 길어지면(예: 자릿수 > 6) PC(3열)에서 드래그할 때만 그 열을 정수로 재번호(현행 로직 재사용, cols === MEMO_MAX_COLS일 때만).
- `onAddMemo`(1912-1927): 가장 짧은 열 계산을 `getMemoCols()` 대신 `MEMO_MAX_COLS`(720) 기준 저장 col로(봇 `cmd_memo_add`와 동일 규칙). 순서 밀기도 저장 col 기준. 모바일에선 col 2에 넣어도 화면 col 1에 보이므로 문제없음.
- `sameMemos`(1861)는 그대로 사용 가능.
- 난이도 S · 위험 낮음(memos.json 형식 불변, 봇 호환 확인함).

### A6. 하위 할 일 ×는 영구 삭제 (2325-2330, 2471-2494)
- 하위도 보관함으로: `onDelete`의 `indent > 0` 분기 제거 → `archiveActiveTask` 공용.
- archive entry에 하위 전용 필드 추가(하위 호환): `{ ..., block: 들여쓰기 0으로 정규화한 블록, parent: '부모 첫 줄 원문' }`. 정규화는 기존 `adjustBlockIndent(block, -baseIndent)`(1235) 재사용.
  - 이유: 지금 `onRestore`(1616)는 블록을 섹션 끝에 그대로 넣으므로, 들여쓴 채 넣으면 **직전 상위 항목의 하위로 붙어버림**(엉뚱한 부모).
- 복구 시: `parent` 원문을 같은 섹션에서 찾으면 그 부모의 마지막 하위로(`moveLineToPosition`의 `intoLine` 삽입 루프 1295-1303을 `childInsertIndex(lines, parentIdx)`로 분리해 재사용), 못 찾으면 상위 항목으로 섹션 끝에.
- Archive 목록(1472-1476)에 하위 항목이면 "↳ 부모명" 회색 한 줄(선택).
- `sec` 찾기(1582)가 `lineIndex`로 섹션을 찾으므로 하위에서도 동작함(확인).
- 아이콘·툴팁 통일(2327): 상위/하위 모두 "보관". B1 채택 시 확인창 없이 실행취소 토스트.
- 난이도 S~M · 위험 낮음. **B1과 독립적으로 옮길 수 있음**(확인창 유지해도 됨).

### A7. 저장 상태 표시가 거짓 (2064-2071, 1339·1422·1653·2191, 3028)
- F2 `syncStatus` 단일 관리자: `{ loading, pending: {active,inbox,archive,memos}, error: {file, message, retry} | null }`.
  - 4개 `ghSave*` 래퍼(또는 F3 스토어)가 시작/성공/실패를 보고. `renderSync()`는 인자 없이 이 객체만 읽음.
  - 각 render 함수의 하드코딩 `<span>동기화됨</span>` 4곳 → `syncPillHTML()` 한 곳(F5와 같이 하면 1곳).
  - 오류는 "다음 성공 저장" 또는 "다시 시도 성공" 때만 지움(탭 이동으로 지우지 않음 — ④ 해결은 "오류가 다른 탭 것이라도 실제로 미저장이면 계속 보여야 맞다"는 쪽). 미저장이 없는 과거 오류면 탭 이동 시 지움.
- 첫 로딩: `init`(3028)에서 `syncStatus.loading = true` → 섹션 자리에 스켈레톤 3줄(CSS 405-411 재사용) → `Promise.all` 완료 후 해제. 로드 실패 시(현재 `.catch(() => {})`로 삼킴, 3029) 오류 + "다시 시도".
- 헤더 메타 두 줄 밀림: pill을 날짜 줄과 같은 줄 오른쪽 고정 폭으로(B8과 같이 결정).
- 난이도 S(F2) · 위험 낮음.

### A8. Inbox H/M/L 연타 → conflict (1388-1391, 1968-1977)
- [단독] `inFlightInbox = new Set()`(키: 항목 텍스트+lineIdx). 처리 중이면 행에 `.busy`(opacity .5, `pointer-events:none`), 함수 진입부에서 중복 무시. 선택 바 버튼(1962-1965)도 처리 중 비활성.
- [기반] B9 채택 시 행을 즉시 Inbox view에서 빼므로(이동 pending) 두 번째 클릭 자체가 불가.
- 오류 문구 `실패: conflict` → F3가 409를 내부 재시도하므로 사용자에게 안 보임.
- 난이도 S · 위험 낮음.

### A9. Archive에서 Inbox 추가 후 배지 미갱신 (2823)
- F5 `renderCurrent()`(현재 `refresh` 3037-3040의 분기를 함수로 추출) → `onAddToInbox`에서 탭과 무관하게 `renderCurrent()`.
- B5에서 Archive FAB를 없애면 경로 자체가 사라짐. 그래도 배지는 봇 추가·refresh에도 맞아야 하므로 `renderCurrent()`는 유지 가치 있음.
- 난이도 S · 위험 없음.

### A10. 빈 메모가 저장됨 (1910-1940, 1887-1900)
- [단독] **초안 메모**: `onAddMemo`는 저장하지 않고 `state.memos`에 `{..., _draft: true}`로 로컬 추가 → 그리기 → 편집 시작.
  - `finish`(1887): 글이 비었으면 로컬에서 제거만(저장 없음). 글이 있으면 `_draft` 떼고 `memo: add`로 저장.
  - 다른 저장(`ghSaveMemos` 941)의 직렬화에서 `_draft` 항목은 제외(필터 한 줄).
  - 기존 메모를 편집해서 빈 글로 만들면 → 삭제(B1 채택 시 실행취소 토스트).
- 주의: 편집 중 `refresh`(visibilitychange)가 오면 `renderMemos`(1648)가 다시 그려 편집이 끊김(E2) → `refresh`에서 메모 편집 중(`.memo.editing` 존재)이면 memo 렌더를 미루고 편집 종료 후 그림. 시트 열림 중에도 동일 가드.
- B5 ②(Memo도 하단 입력창)을 채택하면 "글을 쓴 뒤 생성"이 되므로 근본 해결.
- 난이도 S · 위험 낮음.

---

## 2. 안건 B — 선택·난이도·위험·의존성

난이도 S(반나절 이하) / M(1일 안팎) / L(2일+ 또는 넓은 회귀 범위).

| # | 엔지니어 선택 | 난이도 | 위험 | 의존성·메모 |
|---|---|---|---|---|
| **B1** 확인창 | **② 실행취소 토스트** | M | 중 | **F1(토스트) 필수, A4/F4 권장.** 실행취소 방식은 "지연 저장(5초 뒤 저장)"이 아니라 **"즉시 저장 + 되돌리기 연산"**을 권장: 지연 저장은 그 5초 안에 앱을 닫으면 유실(A3과 같은 함정). 되돌리기 = 보관은 entry id로 복구(`onRestore` 재사용), Inbox 분류는 역방향 이동(`runMove` 반대), 메모 삭제는 지운 메모 객체를 원래 col/order로 재삽입. 영구 삭제(1563, 1633)·토큰 재입력(3055)만 confirm 유지. 완료(체크)는 이미 확인창 없음 — 체크 해제가 곧 되돌리기라 토스트 불필요(B11 연쇄 완료 때만). |
| **B2** 행 ⋮⋮·× | **② ×만 남기고 ⋮⋮는 길게 눌러 드래그** | M | 중 | **F6(길게 누르기) 공용 — B13과 묶어서.** ③ 스와이프는 세로 스크롤·iOS 뒤로가기 가장자리 제스처와 충돌, 가로 이동 판정·되튕김 애니메이션까지 L이고 리서치도 오조작 경고. ④는 모바일에서 드래그 정렬 수단이 사라짐. 주의: 길게 누르기 vs 글자 탭=편집(2308) 구분(이동 8px 미만·350ms 이상만 드래그), iOS 롱프레스 메뉴 차단(`-webkit-touch-callout:none`, 행 `user-select:none`). PC는 hover 핸들 유지. |
| **B3** 완료 항목 | **② "완료 n개" 접기 행** | S~M | 낮음 | 표시만 바뀌고 파일 형식 불변. `sortItemsIncompleteFirst`(2039) 블록 분리 로직을 재사용해 "체크된 최상위 블록"을 섹션 하단 접기 영역으로. ⇅ 버튼·`sortIncompleteFirst`(747, 2076, 2977) 제거. 접힘 상태는 기존 `collapsedSet`처럼 localStorage. 드래그: 접힌 영역은 DOM에 없으므로 "섹션 끝에 놓기"는 완료 항목 뒤가 아니라 **미완료 마지막 행 뒤**에 넣도록 `beforeLine` = 첫 완료 블록 줄로 지정(안 하면 완료 항목 아래로 들어가 안 보임). 체크 직후 바로 접히면 튀므로 0.6초 지연 후 이동(B9·F1과 무관하게 단독 가능). |
| **B4** 탭 언어 | ③(또는 ②) — 엔지니어는 중립 | S | 낮음 | 문자열 교체뿐. **F5(헤더·탭 템플릿 1곳) 먼저 하면 4곳→1곳.** `SECTION_KEYS`(718)는 파일 헤더라 바꾸면 안 됨 — 화면 라벨은 별도 상수 `PRI_LABEL`로 분리(B10과 같은 커밋 후보). |
| **B5** 추가 방식 | **② 하단 입력창을 Inbox·Memo에도, Archive 없음** | M | 중 | 컴포저를 탭별 모드로 일반화: `composerMode = 'active'|'inbox'|'memo'`, Inbox·Memo에서는 🍋 버튼 숨김, Memo는 `textarea` 자동 높이 + Shift+Enter 줄바꿈(메모는 여러 줄). FAB·`openInboxSheet`(2694) 제거, 시트는 편집 전용으로 축소. **A9·A10을 근본 해소.** A1 복원 로직을 모드 공용으로. 선택 바(`.inbox-bar` 501)가 컴포저와 같은 자리 → 선택 중엔 컴포저 숨김(감사 B5 해결). |
| **B6** 인라인 `!!!` | **① 넣는다** (단, 엄격한 규칙) | S | 낮음 | 컴포저에서만, 입력 **맨 앞 또는 맨 끝의 공백으로 분리된 `!`·`!!`·`!!!` 토큰**만 인식(`/(^|\s)(!{1,3})(\s|$)/`를 앞/끝에서만). 실데이터에 글 끝이나 앞에 느낌표가 여러 개 붙은 경우처럼 붙은 느낌표가 있으므로 붙은 것·4개 이상은 무시해야 함. 인식되면 🍋 버튼 아이콘을 즉시 바꿔 미리보기, 저장 시 토큰 제거 → 파일 형식 불변. 봇에는 영향 없음(봇은 inbox만 씀). B10 아이콘 상수 사용. |
| **B7** 하위 할 일 만들기 | **② 편집 시트에 "하위 할 일 추가"** | S~M | 낮음 | 순수 함수 `insertChild(lines, parentIdx, text)` = F3 연산 하나. 위치 계산은 `moveLineToPosition`의 `intoLine` 루프(1295-1303)를 `childInsertIndex`로 분리해 공유(A6 복구와 같은 헬퍼 → A6과 같은 커밋 또는 A6 먼저). 깊이는 1단계 하위까지만 허용 권장(리서치 "하지 말 것 9"). ③ 들여쓰기 문법은 "어느 부모?"가 모호해 비권장. |
| **B8** 저장 pill | **② 평소 숨김·저장 중 작게·실패 시 강조+다시 시도** | S | 낮음 | **F2 위에서만 의미 있음**(지금 pill은 상태를 모름). `beforeunload`로 미저장 경고 추가(F3 pending > 0일 때). |
| **B9** 낙관적 범위 | **② 전부 — 단 F3 위에서 단계적으로** (F3 못 하면 ③) | L(전체) / M(③) | 중~높음 | F3 없이 핸들러마다 낙관적 처리를 붙이면 A3b 같은 덮어쓰기 버그가 늘어남 → **F3 선행 필수**. 순서: 추가(컴포저·시트) → 보관 → Inbox 분류/이동(F4) → 드래그. 실패 시 되돌림은 "pending 연산 제거 → view 재계산"이라 화면 깜빡임 최소. 처리 중 행은 흐리게(`.pending` 클래스). |
| **B10** 우선순위 표기 통일 | 찬성 | S | 낮음 | 상수 1개 `PRI = { high:{icon:'🍅',label}, ... }`로 통합: `COMPOSER_PRI_ICON`(2828), 섹션 아이콘(2216), Archive 배지(1462), Inbox 버튼(1383-1385), 선택 바(688-690), 시트 pill(667-669), 토스트(1975·1992 `SECTION_KEYS` 사용 → `PRI` 사용). **`SECTION_KEYS`는 파일용으로 그대로 둠.** Archive의 🥚(Inbox 출처)는 우선순위가 아니므로 유지. |
| **B11** 부모 완료 시 하위도 완료 | **① 넣는다 — B1/F1 토스트가 있을 때만** | S~M | 중 | 연산 `opToggleBlock(raw, checked)`: 부모 체크 시 미완료 하위를 함께 `[x]`, 직전 하위 상태를 토스트 "하위 n개도 완료 · 되돌리기"에 담아 복원. 부모 체크 해제 시 하위는 건드리지 않음(규칙 단순화). 토스트 없이 넣으면 하위 상태를 잃고 복구 수단이 없음 → F1 없으면 ②. 봇 `cmd_done`과 무관. |
| **B12** 탭 위치 | **① 상단 유지 + 높이 44px** | S(①) / L(②) | ②는 높음 | 하단엔 이미 컴포저·선택 바 2종·토스트·FAB·시트가 `position:fixed; bottom`으로 겹쳐 있음(254, 269, 386, 501). 하단 탭바를 넣으면 이 5개 위치·safe-area·키보드(visualViewport, 감사 B9)를 전부 재조정 → 회귀 범위 큼. 하려면 B5(FAB 제거) 이후 별도 실험. |
| **B13** Memo 스크롤 | **① 길게 눌러 드래그** (F6 공용, iOS에서 불안하면 ②로 후퇴) | M | 중 | `.memo`의 `touch-action:none`(589) → `pan-y`. 350ms 유지(8px 이내) 후 드래그 시작, 시작된 뒤에는 **`touchmove`를 `{passive:false}`로 받아 `preventDefault()`** 해야 브라우저 스크롤이 끼어들어 `pointercancel`이 나지 않음(이 부분이 핵심 함정). 짧은 탭 = 편집(1749) 유지. B2와 같은 F6 유틸을 쓰므로 **B13 먼저 → B2**(메모가 증상이 더 심각하고 DOM이 단순). |
| **B14** 기타 | 아래 표 | — | — | — |

**B14 세부**
| 항목 | 선택 | 난이도 | 메모 |
|---|---|---|---|
| 대비 D4 | 포함 | S | CSS 토큰만(`--muted` .55→.65, 작은 배지용 진한 빨강 토큰). 다크 값 불변 |
| 터치 타깃 감사 B3·B8 | 포함 | S | 체크 영역 확대는 `.task` 왼쪽 44px에 투명 라벨, 탭 높이 44px. 기존 `::before` 확장(490-498)과 겹침 확인 |
| 링크 자동화 C12 | 포함 | S | `highlightMeta`(807)에서 **이스케이프 후** `https?://` 만 `<a target=_blank rel="noopener">`로. 클릭은 `stopPropagation`(편집 시트 안 열림). 파일 원문 불변. `javascript:` 등 다른 스킴 금지 |
| 보관 날짜 C9 | 포함(상대 날짜만) | S | `deletedAt`(1415)로 "3일 전". 30일 정리 안내는 보류 |
| 빈 상태 | 포함 | S | 문구만(2228, 1351, 1434) |
| 키보드 접근성 D1~D3 | D3 포함, D2 포함, D1 일부 | S / M / M | D3: 토스트 `role=status aria-live=polite`, 탭 `role=tablist/tab aria-selected`(F5 1곳). D2: 렌더 전 포커스 대상의 `raw`를 기억 → 렌더 후 같은 행 체크박스에 `focus()`. D1: 할 일 글 `tabindex=0`+Enter로 시트(쉬움), 드래그 핸들 ↑↓ 이동은 보류 |
| 키보드·시트 가림 감사 B9 | 보류 | M | iOS 실기기 확인 후 `visualViewport` 보정 |

---

## 3. 공용 기반과 구현 순서

### 3-1. 공용 기반 (먼저 만들 것)
| ID | 이름 | 내용 | 크기 | 쓰는 항목 |
|---|---|---|---|---|
| **F5** | 화면 틀 통합 | 4개 render(1334, 1417, 1648, 2185)에 복붙된 헤더·탭 마크업 → `renderShell(tab, bodyHTML)` 1곳, `renderCurrent()` 추출. **동작 변화 없음** | S | A7, A9, B4, B10, D3 — 이후 커밋들이 같은 줄을 4번 고치지 않게 해 **충돌·이식 난이도를 크게 낮춤** |
| **F1** | 토스트 v2 | `notify.info(msg)`, `notify.undo(msg, onUndo)`(5초), `notify.error(msg, {retry})`(5초+). 새 토스트가 오면 이전 것 교체(이전 실행취소는 이미 저장된 상태이므로 그냥 사라짐). `role=status`. 기존 `toast()`(810)는 호환 래퍼로 남김 | S | A1, A2, A4, A6, B1, B11, C11 |
| **F2** | 저장 상태 관리자 | `syncStatus` + `renderSync()` + 첫 로딩 스켈레톤. 파일별 pending·error·retry | S | A7, B8, (F3가 보고) |
| **F3** | 파일 스토어(파일별 직렬화 큐 + 의도 기반 연산 + 409 rebase) | 아래 스케치. `serializeActive`(1168)·`toggleSync`(2408)·`composerQueue`(2845)·4개 `ghSave*`를 흡수 | L | A3, A3b, A3c, A4, A8, B9, B11 — **무결성 핵심** |
| **F4** | 두 파일 이동 `runMove` | 추가→제거, 실패 시 보상, 저널 | S(F3 위) | A4, B1(Inbox 분류 되돌리기) |
| **F6** | 길게 눌러 드래그 유틸 | `attachLongPressDrag(el, {onTap, onDragStart})`: 350ms·8px·햅틱 `navigator.vibrate?.(10)`·`touchmove` 비수동 차단 | M | B13, B2 |

**F3 스케치**
```js
function createStore({ url, file, parse, serialize, emptyContent }) {
  const s = { base: null, sha: '', pending: [], view: null, queue: Promise.resolve(), timer: null };
  const recompute = () => { s.view = s.pending.reduce((c, p) => p.op(c), s.base); };
  s.apply = (op, { debounce = 0 } = {}) => {        // 낙관적: view 즉시 갱신
    const p = { op, done: deferred() }; s.pending.push(p); recompute();
    clearTimeout(s.timer); s.timer = setTimeout(s.flush, debounce);
    return p.done.promise;                          // 호출자는 성공/실패를 기다릴 수 있음
  };
  s.flush = () => (s.queue = s.queue.then(async () => {
    const batch = s.pending.slice(); if (!batch.length) return;
    for (let attempt = 0; ; attempt++) {
      const next = batch.reduce((c, p) => p.op(c), s.base);   // base 위에 재적용
      syncStatus.start(file);
      const res = await put(url, serialize(next), s.sha);
      if (res.ok) { s.base = next; s.sha = res.sha; s.pending = s.pending.filter(p => !batch.includes(p));
                    recompute(); syncStatus.ok(file); batch.forEach(p => p.done.resolve()); return; }
      if (res.status === 409 && attempt < 2) { await s.reload({ silent: true }); continue; } // rebase
      syncStatus.fail(file, { retry: s.flush }); batch.forEach(p => p.done.reject(res.error)); return;
    }
  }));
  s.reload = async () => { const r = await get(url); s.base = parse(r.content); s.sha = r.sha; recompute(); };
  s.drop = (p) => { s.pending = s.pending.filter(x => x !== p); recompute(); }; // 실패 시 되돌림
  return s;
}
// 연산은 모두 (content) => content 순수 함수, 대상은 원문 줄/텍스트/id로 찾는다.
```
- active.md 연산: 기존 `toggleAt`/`appendToSection`/`editLine`/`deleteAt`/`moveLineToPosition`을 `(lines, ...)` 순수형으로 바꾸고 첫 단계에서 `resolveLineIndex`로 위치 확인. 이미 대부분 `state.content.split('\n')`로 시작하므로 **인자로 content를 받게 바꾸는 기계적 변경**.
- `state.content`/`state.sections`는 `stores.active.view`에서 파생(getter)으로 두어 렌더 코드 변경 최소화.
- 실패한 연산을 자동으로 버릴지(되돌림) 남길지: 추가·편집은 남기고 "다시 시도"(사용자 입력 보호), 이동·보관은 버리고 원위치(중복·유실 방지). 연산마다 `onFail: 'keep' | 'drop'`.

### 3-2. 권장 구현 순서 = 커밋 단위
본 서비스로 옮길 때 **위에서부터 순서대로 고르면 충돌 없이 적용**되도록 배치했다. 각 커밋은 하나만 골라도 동작하게 만든다(기반에 의존하는 경우 표시).

| # | 커밋 | 의존 | 본 서비스 이식 |
|---|---|---|---|
| 0 | (lab 전용) mock 강화: 파일·메서드별 실패 주입 `__takoMockFail = {file, method, times}`, 외부 작성자 흉내 `__takoMockExternalWrite(file, fn)`(봇이 사이에 쓰는 409 재현) | — | **옮기지 않음** |
| 1 | `refactor: 헤더·탭 템플릿 통합 + renderCurrent` (F5) | — | 권장(이후 커밋 전제) |
| 2 | `feat: 토스트 v2(실행취소·다시 시도·aria-live)` (F1) | — | 권장 |
| 3 | `fix(A9): Inbox 추가 후 배지 갱신` | 1 | 단독 가능 |
| 4 | `fix(A5): 메모 저장 열을 PC 기준으로 고정` | — | 단독 |
| 5 | `fix(A10): 빈 메모는 저장하지 않음 + 편집 중 refresh 보류` | — | 단독 |
| 6 | `fix(A6): 하위 할 일도 보관 + 부모 아래로 복구` (+ `childInsertIndex` 분리) | — | 단독 |
| 7 | `fix(A1): 컴포저 추가 실패 시 글 복원` | 2(없으면 기존 toast) | 단독 |
| 8 | `fix(A2): 시트는 저장 성공 후 닫기` | — | 단독 |
| 9 | `fix(A8): Inbox 처리 중 행 잠금` | — | 단독(16 이후엔 불필요) |
| 10 | `feat(A7): 저장 상태 관리자 + 첫 로딩 스켈레톤` (F2) | 1 | 권장 |
| 11 | `fix(A3-min): 숨김 시 즉시 저장·refresh 전 flush·토글 큐 직렬화` | — | **F3를 안 옮길 경우의 대안**. F3를 옮기면 건너뜀 |
| 12 | `refactor: active.md 스토어 도입(F3-1) — A3/A3b/A3c 해결` | 10 | 핵심. 이식 시 12~14를 묶어서 |
| 13 | `refactor: inbox·archive·memos 스토어(F3-2) — 409 자동 재적용` | 12 | 〃 |
| 14 | `fix(A4): 두 파일 이동 보상(runMove) + 의도 기반 inbox 삭제` (F4) | 13 | 〃 |
| 15 | `feat(B1): 보관·메모 삭제·분류 확인창 → 실행취소` | 2, 14 권장 | 선택 |
| 16 | `feat(B9): 추가·보관 낙관적 반영` → `feat(B9): 분류·이동 낙관적 반영` (2커밋) | 12~14 | 선택 |
| 17 | `style(B10): 우선순위 표기 🍅🍋🥝 통일` | 1 | 선택 |
| 18 | `copy(B4/C3): 문구·오류 쉬운 말` | 1, 17 | 선택 |
| 19 | `feat(B3): 완료 n개 접기, ⇅ 제거` | — | 선택 |
| 20 | `feat(B6): 입력창 !/!!/!!! 우선순위` | 17 | 선택 |
| 21 | `feat(B7): 편집 시트 하위 할 일 추가` | 6 | 선택 |
| 22 | `feat(B11): 부모 완료 시 하위 완료 + 되돌리기` | 2 | 선택 |
| 23 | `feat(B8): 저장 표시 최소화 + beforeunload` | 10 | 선택 |
| 24 | `feat(B5): 하단 입력창 Inbox·Memo 확장, FAB 제거` | 7, 5 | 선택 |
| 25 | `feat: 길게 눌러 드래그 유틸(F6) + B13 메모 스크롤` | — | 선택 |
| 26 | `feat(B2): 모바일 ⋮⋮ 숨김, 길게 눌러 드래그` | 25 | 선택 |
| 27~ | B14 각각 1커밋(대비, 터치 타깃, 링크, 보관 날짜, 빈 상태, a11y) | 1(a11y 탭) | 선택 |

### 3-3. 이식 용이성을 위한 규칙
1. **커밋 1개 = 감사 ID 1개(또는 기반 1개)**. 커밋 메시지에 ID(`A5`, `B10`, `F3`)를 넣어 본 서비스에서 `git cherry-pick`/수동 이식 시 추적.
2. lab 전용 코드(`mock-github.js` 로드 703줄, `<title>Tako Lab`, 서비스워커 주석 3009)는 커밋에 섞지 않는다.
3. 기반(F*)은 새 코드를 **한 블록(섹션 주석 `// ============ Store ============`)에 모으고**, 기존 함수는 시그니처를 유지하는 얇은 래퍼로 남겨 이후 커밋 diff를 작게 유지.
4. 공용 상수(`PRI`, 문구)는 파일 상단 Config(707-720) 근처 한 곳.
5. 각 커밋마다 lab mock으로 확인할 시나리오(커밋 메시지 본문에 기록): 정상 / `__takoMockFail` 전체 실패 / 특정 파일 PUT만 실패(A4) / 외부 작성자 끼어들기 409 / 체크 직후 `visibilitychange` / 추가 직후 0.3초 내 체크(A3b) / 모바일 375px.

### 3-4. 위험 요약
- 가장 위험: **F3(12~14)** — active.md 쓰기 경로 전부 교체. 대신 무결성 버그 대부분(A3·A3b·A3c·A4·A8·409)을 근본 해결. 이식 시 반드시 묶음으로.
- F3를 당장 못 옮기면: 11(A3-min) + 9(A8) + 개별 A 수정만으로도 "심각도 상" 유실 6건 중 A1·A2·A5·A6·A10은 해결, A3는 부분 해결, A4는 미해결(중복 남음, 유실은 아님).
- 파일 형식 변경은 A5(col 의미 고정, 기존과 호환)·A6(archive 필드 추가)뿐. 봇·Skill 코드 수정 불필요.
