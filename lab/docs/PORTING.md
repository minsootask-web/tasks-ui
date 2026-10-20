# tako UX 실험실 → 본 서비스 이식 가이드

- 대상: `lab/index.html`(ux-lab 브랜치) → 루트 `index.html`(본 서비스, GitHub Pages "tako")
- 기준 커밋: `0e3396b` (QA3·사용성 2차 반영 뒤 코드·테스트 마지막 커밋. 그 뒤 커밋은 이 문서뿐)
- 회의 결정: 1차·2차 회의록(`meetings/m1-minutes.md`, `meetings/m2-minutes.md`)
- 파일 형식은 그대로다. active.md·inbox.md·memos.json·archive.json을 봇·Skill과 계속 같이 쓸 수 있다(아래 "데이터").

---

## 1. 옮기는 방법 두 가지

### 방법 ① 전부 옮기기 (권장)
lab의 커밋들은 **같은 파일을 순서대로 고친 것**이고, 안전 기반(A) 수정이 화면 개선(B~F) 뒤에도 계속 이어져 있다.
그래서 가장 안전한 길은 "lab의 최종 파일을 통째로 가져와 lab 전용 코드만 되돌리는 것"이다.

```bash
cd tasks-ui
git checkout main && git pull
git checkout -b port/tako-ux
git show 0e3396b:lab/index.html > index.html        # lab 최종본을 루트로
# 2장 "lab 전용 코드 제거 목록"대로 고친다
mkdir -p tests && git show 0e3396b:lab/tests/run.js > tests/run.js
node tests/run.js index.html                         # 실패 0·건너뜀 0(엄격 관문)이어야 함
git add index.html tests/run.js && git commit -m "feat: tako UX 개선 이식(lab 0e3396b)"
```

### 방법 ② 묶음만 골라 옮기기
3장의 묶음 표에서 고른 묶음의 커밋을 **오래된 순서대로** 패치로 만들어 적용한다. 고르지 않은 묶음의 커밋이
같은 줄을 먼저 고쳤으면 충돌이 나므로, 충돌 때마다 lab 최종본(`git show 0e3396b:lab/index.html`)을 참고해 손으로 맞춘다.
**묶음 A는 반드시 통째로**(쓰기 경로 전체가 바뀜), 그리고 의존하는 묶음을 먼저.

> **주의(QA3 시험 결과)**: 묶음 A만 이 방법으로 옮기면 A 커밋 39개 중 14번째(`3d99e43` Q2)에서 바로 충돌한다.
> A 커밋 사이에 B~E 커밋이 같은 줄을 먼저 고쳤기 때문이고, 3·4차 수정(locate·저널·되돌리기 기록)은 A와 B·D에 걸쳐 있어
> 충돌이 더 많다. **A를 포함해 옮길 때는 방법 ②를 쓰지 말고**, 방법 ①로 전부 옮긴 뒤 원하지 않는 묶음(대개 화면 쪽 D·E)을
> 손으로 되돌리는 편이 안전하다. 방법 ②는 A와 겹치지 않는 E(표기·말)처럼 작은 묶음을 먼저 맛보기로 옮길 때만.

```bash
# 예: 묶음 E(표기·말)만 — 커밋 목록은 3장 표에서 복사
OUT=/tmp/port-E; mkdir -p $OUT
for c in 0e71fcc a42da2a 8fcd788 2709a57 a710947 b257c3d e8b2cd8 a23aca0 cf7eb91 060a831 e57ef21 d67e959 85e9e36; do
  git format-patch -1 "$c" -o "$OUT" --start-number "$(ls $OUT | wc -l | tr -d ' ')" -- lab/index.html
done
sed -i '' 's#lab/index\.html#index.html#g' $OUT/*.patch     # 경로만 바꿈(macOS sed)
git checkout -b port/tako-E main
git am -3 $OUT/*.patch                                      # 충돌 시: 고치고 git add index.html && git am --continue
node tests/run.js index.html --allow-skip                   # 옮기지 않은 묶음의 함수 테스트는 건너뜀
```

> 커밋 순서: 3장 표의 커밋은 이미 오래된 순서다. `git log --reverse --format='%h %s' 93ddb17..0e3396b`로 다시 확인할 수 있다.

---

## 2. lab 전용 코드 제거 목록 (방법 ①·② 공통)

| # | 위치(`index.html`) | lab | 본 서비스로 바꿀 것 |
|---|---|---|---|
| 1 | `<title>` | `Tako Lab` | `Tako` |
| 2 | `<link rel="manifest">`, 파비콘 4개, `apple-touch-icon` | `../manifest.json` 등 상위 폴더 | `manifest.json` 등 같은 폴더 |
| 3 | `<!-- UX 실험실: 가짜 GitHub API (실제 데이터 미접근) -->` 주석 줄과 그 아래 `<script src="mock-github.js"></script>` | 가짜 GitHub API | **두 줄 모두 삭제**(script 줄만 지우면 주석이 남음 — 동작은 무해) |
| 4 | `<head>` 테마 즉시 적용 스크립트 | `localStorage.getItem('tako_lab_tasks_theme')` | `'tasks_theme'` |
| 5 | `const LS_PREFIX = 'tako_lab_';` | lab 키 접두사 | `const LS_PREFIX = '';` — 기존 키(`gh_pat`·`tasks_collapsed`·`tasks_theme`) 그대로라 기존 사용자 토큰·설정 유지 |
| 6 | `// [lab 전용] fail closed(C2)` 주석 + `function labMockGuard()`와 `init()` 첫 줄 `if (!labMockGuard()) return;` | mock 없으면 실행 거부(`__TAKO_LAB_MOCK`·`fetch.__takoMock` 확인) | **주석·함수·호출 삭제**. 바로 위 `isTextEntry`(단축키 규칙)는 본 서비스 코드라 남김 |
| 7 | `init()` 안 서비스워커 블록(`sw-lab.js` 등록, controllerchange 새로 열기, `tako_lab_sw_reloaded`) | lab 전용 빈 워커 | 원래 코드로: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});` |
| 8 | 파일 | `lab/mock-github.js`, `lab/sw-lab.js`, `lab/docs/` | **옮기지 않음**. `lab/tests/run.js`는 루트 `tests/run.js`로 옮겨 계속 사용 |
| 9 | 주석 | `[lab 전용]`·`tako_lab_`·`mock-github.js`를 언급하는 주석 3곳(테마 스크립트·LS_PREFIX·labMockGuard 자리) | 주석도 본 서비스 기준으로 고치거나 지움(남아도 동작엔 무해) |

다 고친 뒤 확인:
```bash
grep -nE "mock-github|__TAKO_LAB|__takoMock|sw-lab|tako_lab_|Tako Lab|실험실|\[lab|\.\./(manifest|favicon|apple)" index.html   # 0건(9번 주석까지 정리했다면)
node tests/run.js index.html                                                                                                 # 실패 0·건너뜀 0
```

---

## 3. 묶음(고르는 단위)

| 묶음 | 좋아지는 점(쉬운 말) | 기대는 묶음 | 위험 | 커밋(오래된 순) |
|---|---|---|---|---|
| **0 정리** | 화면 변화 없음. 쓰지 않는 코드를 지우고 자동 점검을 붙인다 | — | 없음 | `7dd0c63`(R18 죽은 코드) · `59cd547`(테스트 → `tests/run.js`로) · `0e3396b` S19(엄격 관문·QA3 재현 테스트) |
| **A 안전 기반 (필수)** | 저장이 실패해도 쓴 글이 사라지지 않고, 체크가 풀리거나 같은 항목이 두 곳에 남는 일이 없다. 실패는 쉬운 말과 "다시 시도"로 알려 준다 | — | **높음**(저장 방식 전체 교체) → 통째로, 4장 관문 필수 | `9de1337` F5 · `3147ac9` F1 · `f6fc29e` A9 · `9d6e861` A5 · `e1986b5` A10 · `06f5e5a` A6 · `07c2ef3` A1 · `b11d5c2` A2 · `cd1e164` A8 · `5a24a70` F2/A7 · `e765b35` F3-1 · `8386d26` F3-2 · `b830ecc` F4 · `3d99e43` Q2 · `63e04cc` Q1 · `8f56bef` Q3 · `89e3bf2` Q4 · `f541d39` Q5 · `91966d7` Q10 · `c2a816a` Q14 · `3f9be7f` Q7 · `397ae5a` Q6 · `f819843` Q15 · `01d1f12` Q8 · `c22ca8e` Q9 · `d043221` Q11 · `3169ed1` Q12 · `fdcc4dc` Q18 · `774fb52` Q16 · `5e82a23` Q13 · `38f1443` Q17 · `53dd552` C2(키 상수, 접두사는 `''`) · `0b0c140` R2 · `e0a18ed` R16·R11 · `169585a` R5 · `f62e894` B-6 · `330ab7b` B-3 · `378fc77` R7 · `940eb8d` R20 · `efab762` locate(S4·R2) · `f2a3c3d` S3 · `e7ada71` S5·S6·S7·S20④ · `4b6debe` 다시 시도 알약·오프라인 문구 |
| **B 즉시 반영·되돌리기** | 누르는 즉시 결과가 보이고, 확인창 대신 "되돌리기". 빨리 두 번 눌러도 다음 항목이 딸려 가지 않는다. PC는 Cmd/Ctrl+Z로 마지막 동작을 무른다 | A | 중 | `b2eb875` B1 · `ac4eafe` B9 · `b613915` C1(R8·R15) · `8bb4be2` D2 · `398a306` S1·S13 · `e817332` S12·S1 · `67fa394` S15 · `0cf0ebb` S16 · `b46eaa1` 복구 원래 자리 |
| **C 목록 정돈** | 끝낸 일은 "완료 n개" 아래로 접혀 남은 일만 보인다. 부모를 끝내면 하위도 같이 끝난다. 편집 시트에서 하위 할 일을 바로 만든다. 헤더에 "남은 할 일 n" | A (B11 되돌리기는 F1) | 낮음~중 | `8f2f675` B3 · `de79cbe` B7 · `9f7d93b` B11 · `7a4774e` B3 보정 · `60d02dd` C4 · `a057807` R9 · `5a23c5f` R10 · `de1e8d4` B-7 |
| **D 모바일 손맛** | 휴대폰에서 행이 깔끔해지고(⋮⋮·× 없음) 길게 눌러 옮긴다. 메모 위에서도 스크롤된다. 모든 탭에 같은 하단 입력창, 붙여넣은 여러 줄은 여러 항목으로. 탭이 위에 붙어 있다 | A · B(시트 "보관함으로"가 되돌리기 토스트 사용) · C(드래그 "섹션 끝" 규칙) | 중 — 실기기 감도 확인 필요 | `1ac1926` B5 · `89439a5` F6·B13 · `662cbc3` B2 · `30b3001` B5 보정 · `88c6a0f` B12 · `09f8e0c` 터치 44px · `863de51` 선택 바 ✕ · `3ae5c2c` R1 · `adb2475` R4 · `41b8da7` R3·R22 · `bfaf8b1` R13 · `763a6de` B-2 · `6f8fad0` R19 · `7a60667` B-8 · `52134f1` D1 · `508adf3` D8 · `5a94a68` 고스트 · `143bb72` 메모 × · `25524ed` S8~S11 · `c45493b` S17 |
| **E 표기·말** | 🍅🍋🥝로 통일, 쉬운 한국어, 글자 대비 개선, 할 일 속 주소가 링크로, 보관 날짜("3일 전"), 빈 화면 안내, 저장 표시는 문제 있을 때만 | 없음(언제든 먼저 옮겨도 됨). 단 B8(저장 표시)은 A의 F2 필요 | 낮음 | `0e71fcc` B10 · `a42da2a` B4 · `d220b1a` B8 · `8fcd788` 모션 변수 · `2709a57` 대비 · `a710947` 링크 · `b257c3d` 보관 날짜 · `e8b2cd8` 빈 상태 · `a23aca0` C7 · `cf7eb91` D5 · `060a831` R14 · `e57ef21` R21 · `d67e959` PC 📥 · `85e9e36` 메타 · `ea3ecb6` 보관함 🗑 선택 바로·출처 폭 |
| **F 키보드·접근성** | PC에서 키보드만으로 추가·편집·완료, `/`·`N`으로 입력창, 시트를 닫아도 제자리. 스크린리더가 항목·저장 상태를 정확히 읽는다. 휴대폰에서 시트를 열 때 키보드가 갑자기 올라오지 않는다 | A · C(포커스가 "완료 n개"로 가는 규칙) | 낮음 | `668ed2e` 키보드 기본 · `f9b141a` 새 항목 스크롤 · `4a8c2af` R17 · `9e87566` R12·D10③ · `527bf2a` D3 · `bca919f` S2·S14·/·Esc · `4caedfc` 완료 뒤 다음 행 포커스 |

**옮기지 않는 커밋(lab 전용)**: `095a20c`·`26d0340`·`d3e757d`(S18) mock, `2ee23e4`·`d9a67d4` lab 서비스워커, `e7f7497`·`dbd4b60`·`54e50bf` 문서.

> 3·4차 수정 가운데 `efab762` locate는 A 이후 거의 모든 연산(B·C·D의 되돌리기·드래그 포함)이 쓰는 기반이다. 방법 ①을 권하는 가장 큰 이유.

**고르는 예**
- 데이터 안전만: 0 → A. 확인창·성공 토스트는 B를 안 옮기면 일부 남는다(A가 확인창 경로를 바꾸지 않는 범위에서). 동작은 예전과 같고 실패에만 강해진다.
- 결정한 것 전부: 방법 ①.
- B 없이 D는 불가(시트 "보관함으로"·되돌리기). D 없이 R1(입력 실패 대기열)·R4는 하단 입력창 모드(B5)가 있어야 동작한다.

---

## 4. 이식 전 체크리스트 (관문)

1. **자동 점검**: `node tests/run.js index.html` → **실패 0 그리고 건너뜀 0**(기본이 엄격 관문 — 함수가 하나라도 없거나
   건너뛰면 종료 코드 1). 방법 ②로 일부만 옮긴 경우에만 `--allow-skip`.
   방법 ①을 사본으로 미리 해 본 결과(0e3396b): 2장 1~7번을 고친 사본에서 34 통과·0 실패·0 건너뜀, `<script>` 2개 문법 오류 없음,
   2장 grep 0건(주석까지 정리). QA3 기준본(69ae2fd)에 같은 테스트를 돌리면 13 실패 — S1·S3·S4 등 재현이 잡힌다
2. **lab 전용 코드 0건**: 2장의 grep 결과 0건
3. **테스트용 저장소로 30분 사용**: 실제 `tasks-data`가 아닌 **테스트용 private 저장소**를 가리키는 토큰으로
   - 할 일 연속 추가(한글 IME 포함)·체크 연타(저장 1번)·드래그 순서/하위로 넣기·보관/복구·Inbox 분류와 되돌리기·메모 편집/삭제
   - 봇(또는 GitHub 웹 편집)으로 같은 파일을 한 번 고친 뒤 앱에서 저장 → "다른 기기에서 바뀐 내용을 불러왔어요"와 함께 두 변경 모두 남는지
   - 비행기 모드로 추가·분류 → 글이 입력창에 남는지, 연결 뒤 정리되는지
4. **실기기 1회**(iPhone 홈 화면 PWA, Android Chrome)
   - **1순위(S17)**: Android Chrome에서 행·메모를 길게 눌러 끌 때 화면이 스크롤로 바뀌거나 드래그가 취소되지 않는지.
     iPhone에서는 행 위에서 시작한 세로 스크롤이 막히지 않는지(누르는 순간 붙이는 리스너는 드래그 시작 뒤에만 막음)
   - 길게 누르기 400ms 감도·차오름 모션, 고스트 위치, 메모 위 세로 스크롤
   - Android 한글 조합 중 Enter(보내기)가 한 번에 보내지는지(QA3 확인 항목)
   - 시트·입력창이 키보드에 가리지 않는지(감사 B9, 미검증)
   - 체크 직후 앱 전환 → 돌아왔을 때 체크 유지(keepalive)
   - 붙여넣은 여러 줄이 여러 항목으로 들어가는지, Memo 키보드 키가 "줄바꿈"인지
5. **기존 사용자 확인**: 이식 전에 쓰던 브라우저에서 열어 토큰을 다시 묻지 않는지(`gh_pat` 유지), 접힘 상태 유지
6. lab을 같은 브라우저에서 연 적이 있어도 lab 키는 `tako_lab_` 접두사라 본 서비스와 섞이지 않는다(C2 이후). C2 이전(10/20 이전) lab을 열었던 브라우저에 `tako_pending_moves` 키가 남아 있어도, 옛 형식 기록(`ver`·도착지 개수 없음)은 `runJournal`이 실행하지 않고 지우며 "두 곳에 남은 항목이 있을 수 있어요"만 한 번 알린다(S20④). 미리 지워도 된다
7. **여러 탭**: PC 브라우저 탭 2개(또는 PWA 창 + 탭)를 열고 한쪽에서 Inbox 분류 중 다른 쪽을 새로 고쳐도 항목이 두 곳 모두에서 사라지지 않는지(S5 — 진행 중 기록은 90초 동안 다른 탭이 실행하지 않음)

---

## 5. 데이터(형식은 그대로)
- active.md·inbox.md: 형식 불변. 섹션 헤더 `## 🔥 High`·`## 🟡 Medium`·`## 🟢 Low` 그대로(화면 표기만 🍅🍋🥝). 새 줄은 `- [ ] 글`·`- 글`, 하위는 2칸 들여쓰기
- archive.json: 하위 할 일을 보관하면 `parent`(부모 글) 필드가 생긴다. 상위 할 일을 보관하면 `after`(복구할 원래 자리 = 바로 위 줄의 지문) 필드가 생긴다 — 둘 다 없어도 되는 선택 필드라 옛 항목·봇·Skill이 만든 항목은 그대로 읽히고, `after`가 없거나 못 찾으면 예전처럼 섹션 끝으로 복구
- memos.json: `col`은 늘 0~2(PC 기준, 봇과 같은 규칙), `order`는 소수일 수 있다(모바일 이동). 새 메모는 봇과 같은 규칙(order 0, 같은 열 나머지 +1)
- localStorage(본 서비스, 접두사 `''`): 기존 `gh_pat`·`tasks_collapsed`·`tasks_theme` + 새로 생기는 `tako_done_open`(완료 접기 펼침)·`tako_pending_moves`(두 파일 이동 저널: `ver` 2, 탭 id `owner`·갱신 시각 `beat`, 도착지 개수 `verify[].before`, 결과 모름이면 `sha`)·`tako_composer_failed`(저장 못 한 입력)·`tako_composer_drafts`(입력창 모드별 초안)
