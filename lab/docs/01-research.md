# tako UX 리서치 — 유사 서비스 패턴 조사

작성: 리서처 · 2026-10-20
원칙: 출처를 확인한 것만 적었다. 공식 문서로 확인하지 못하고 제3자 글에만 근거한 항목은 **(2차 출처)**, 확인 실패는 **(미확인)** 으로 표시했다.

---

## 1. 서비스별 핵심 패턴 요약

### Todoist
- **Quick Add 인라인 문법**: 날짜는 자연어("tomorrow at 4 PM"), 우선순위 `p1`/`p2`/`p3`, 프로젝트 `#`, 라벨 `%`(기존 `@`는 단계적 폐지), 마감 `{march 30}`. 단축키 `Q`로 어디서든 Quick Add, 데스크톱 전역 단축키 지원.
  https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz
- **우선순위 표현**: P1 빨강 / P2 주황 / P3 파랑 / P4 무색(기본값). 색은 체크박스(원) 테두리로 드러남. 이름에 p1~p3 입력 시 자동 인식.
  https://get.todoist.help/hc/en-us/articles/205873321-Set-a-priority-in-Todoist
- **키보드 단축키**: `A` 하단에 추가 / `Shift+A` 상단에 추가 / **`Enter` = 저장하고 바로 아래 새 작업(연속 입력)** / `E` 완료 / `1~4` 우선순위 / `Cmd+Z` 실행취소 / `J·K` 이동 / `X` 선택.
  https://www.todoist.com/help/articles/use-keyboard-shortcuts-in-todoist-Wyovn2
- **스와이프**: iOS·Android에서 좌/우 스와이프 동작을 선택·완료·일정·삭제 중에서 사용자가 지정.
  https://www.todoist.com/help/articles/-D5DQOQz6
- **오프라인**: 연결이 끊기면 우측 상단에 오프라인 아이콘이 자동 표시, 재연결 시 자동 동기화. 미동기화 상태에서 앱을 닫지 말라는 경고 배너.
  https://www.todoist.com/help/todoist/features/use-todoist-while-offline-4rbaZw
- **하위 작업**: 접힌 부모에 "2/5" 같은 완료 수 표시, 부모 완료 시 남은 하위 작업도 완료 **(2차 출처)** https://www.usecarly.com/blog/how-to-create-subtasks-in-todoist
- 완료 효과음 "Task complete tone"(설정 > Sound & appearance) **(2차 출처)** https://orionfeedback.org/d/2547-no-sound-when-completing-a-todoist-task
- 완료 후 Undo 토스트의 정확한 동작은 공식 문서로 **(미확인)**.

### Things 3
- **Magic Plus 버튼**: 우하단 플로팅 + 버튼을 **드래그해서 원하는 위치에 떨어뜨리면 그 자리에 새 할 일**이 생김. 좌하단 Inbox 영역에 떨어뜨리면 어느 화면에서든 Inbox로. 헤딩·프로젝트 생성도 같은 버튼으로.
  https://culturedcode.com/things/support/articles/2803582/
- **제스처**: 왼쪽 스와이프 = 선택(이어서 다른 항목 스와이프/탭으로 다중 선택), 오른쪽 스와이프 = When(일정). 길게 누르면 항목이 "손가락 아래로 떠오르고" 드래그로 재정렬, 선택된 여러 개를 함께 드래그. (스와이프 완료 제스처는 문서에 없음)
  같은 출처
- **완료 애니메이션**: 원이 시계방향으로 채워지고(~200ms) 체크가 스프링으로 등장 후 행이 사라짐, 총 ~500ms. iOS는 소리+햅틱 **(2차 출처, 디자인 분석 글)**.
- **인라인 펼침 편집**: 할 일을 탭하면 별도 화면이 아니라 그 행이 카드로 펼쳐져 메모·체크리스트를 편집, 맥락 유지 **(2차 출처)**.
- **절제된 색**: 무채색 기반, 의미 있는 곳(Today 노랑·마감 빨강·Evening 남색)에만 색 **(2차 출처)**.
  https://blakecrosley.com/ja/guides/design/things
- **Logbook**: 완료·취소 항목은 Logbook(아카이브)으로 가고 무기한 보존.
  https://culturedcode.com/things/support/articles/4001304/

### TickTick
- **스마트 날짜 인식**: "Meeting at 9 tomorrow"처럼 쓰면 날짜·시간 인식, 설정에서 끌 수 있음(오인식 대비).
  https://help.ticktick.com/articles/7055782422935240704
- 인라인 기호: `!priority`, `#tag`, `^list`, `*date`, `@user` **(2차 출처, 2020)** https://curtismchale.ca/2020/08/10/ticktick-quick-add-syntax
- **스와이프 커스터마이즈**: 짧은/긴 × 좌/우 4종에 완료·날짜·우선순위·이동·삭제 지정. 공식 블로그가 "실수로 완료되면 스와이프를 None으로 두라"고 안내 → 스와이프 완료는 오조작 위험이 실재함.
  https://blog.ticktick.com/2016/04/25/customize-your-swipe-options-in-ticktick-275/
- Today 목록의 "Plan Your Day"로 미뤄진 항목을 재일정/완료/삭제. https://blog.ticktick.com/2020/12/08/20-lesser-known-ticktick-features/

### Apple 미리알림(Reminders)
- 목록 하단 "New Reminder"로 추가, 생성 중 **키보드 바로 위 퀵 툴바**(날짜·시간·위치·깃발·첨부). 깃발(flag) 하나로 "중요" 표시 → Flagged 스마트 목록.
  https://support.apple.com/en-au/102764 · https://www.macrumors.com/guide/reminders/
- **하위 항목**: 들여쓰기로 하위 항목 생성, 내어쓰기로 해제. **부모를 완료·삭제·이동하면 하위도 함께**. 스마트 목록에서는 하위 항목 생성 불가.
  https://support.apple.com/guide/reminders/remn19b3424c/mac
- 섹션, "Select Reminders" 다중 선택 후 하단 툴바(이동/삭제/완료/깃발).
  https://support.apple.com/en-gw/guide/iphone/iph82596cb20/ios
- 완료 항목은 목록 메뉴의 "Show Completed"로 표시/숨김 **(2차 출처)** https://discussions.apple.com/thread/253599206

### Microsoft To Do
- **My Day**: 매일 밤 비워지는 "오늘" 스마트 목록. 직접 추가하거나 다른 목록에서 "Add to My Day". 전구 아이콘으로 제안 목록(어제 못 끝낸 것, 마감·중요 항목). 못 끝낸 항목은 원래 목록으로 돌아가고 다음 날 제안에 다시 등장.
  https://support.microsoft.com/en-us/ToDo/my-day-and-suggestions
  https://support.microsoft.com/en-us/todo/plan-and-connect-with-microsoft-to-do

### Google Tasks
- 완료 항목은 목록 하단 "Completed (n)" 헤더 아래로 **접혀서** 모이고 펼쳐서 체크 해제 가능. 하위 작업은 **1단계만**. 별표(Star)로 중요 표시, 별표 모아보기 **(2차 출처)**.
  https://tasksboard.com/blog/google-tasks-completed-tasks · https://www.popsci.com/diy/how-to-use-google-tasks/
- Gmail 사이드 패널에서 완료 직후 Undo 제공(검색 결과 요약, 원문 직접 확인은 **미확인**).

### Any.do
- **Moment / Plan my day**: 정해진 시각에 오늘 할 일 + 어제 남은 항목을 한 장씩 보여주고, 각 항목을 오늘/완료/삭제/나중에(내일·이틀 뒤·다음 주·someday)로 빠르게 분류. 2013년 도입, 현재 모바일 중심.
  https://www.androidpolice.com/2013/02/20/any-do-updated-with-dashclock-support-a-new-daily-planning-feature-called-moment-and-more/
  https://zapier.com/blog/anydo-features

### Google Keep
- 정리 수단은 **라벨·색·고정(pin)** 3가지. 고정 메모는 별도 "고정됨" 그룹으로 상단.
  https://support.google.com/keep/answer/6191044
- 보관(Archive)과 휴지통 분리, 삭제 메모는 **휴지통에서 7일간 복구 가능**.
  https://support.google.com/keep/answer/6262765 · https://support.google.com/keep/answer/6262770
- 디자인 비평: 테두리 카드가 "길게 누르면 선택"을 암시, 길게 누르면 테두리 강조+상단에 액션 아이콘. 반대로 삭제가 더보기에 숨어 있어 기대와 어긋난다는 지적.
  https://ixd.prattsi.org/2023/02/design-critique-google-keep-android/
- 편집기 Undo/Redo는 그 편집 세션 안에서만 동작. https://9to5google.com/2017/07/13/google-keep-android-undo-redo-controls-update/

### Apple 메모(Notes)
- 목록에서 **오른쪽 스와이프 → 고정(Pin)**, 또는 길게 눌러 "Pin Note". 고정 메모는 상단 "Pinned" 섹션, 기기 간 동기화.
  https://support.apple.com/en-ie/118442 · https://www.idownloadblog.com/2020/08/03/organize-pinned-notes-section-iphone-ipad/

### Linear (빠른 입력 참고)
- `C`로 어디서든 생성 모달, 모달 안에서 단일 키로 속성 지정(`P` 우선순위, `S` 상태, `L` 라벨), `Cmd+Enter` 저장. **필수 입력은 제목(+상태)뿐, 나머지는 선택** — "빨리 만들고 나중에 다듬기".
  https://linear.app/docs/creating-issues
- "Create more" 연속 생성 토글은 공식 문서에서 **(미확인)**.

### 공통 가이드라인
- **확인창 vs Undo**: 확인창을 남발하면 사용자가 읽지 않고 반사적으로 OK를 누름(Nielsen, "Confirmation Dialogs Can Prevent User Errors — If Not Overused" 인용). 되돌릴 수 있는 작업은 즉시 실행 + Undo, 확인창은 비가역·고위험에만.
  https://uxplanet.org/confirmation-dialogs-how-to-design-dialogues-without-irritation-7b4cf2599956 · https://notes.andymatuschak.org/zXH4ASvHNz488hCNgrBjQJK
- **스낵바**: 짧고 비차단, 액션은 하나(Undo/Retry). 결정이 필요한 상황엔 대화상자.
  https://docs.flutter.dev/cookbook/design/snackbars · https://acorn.firefox.com/latest/mobile/components/snackbar/android-pNOUdFi9
- **터치 타깃**: iOS 44×44pt, Material 48dp, WCAG 2.2 AA 최소 24×24px(AAA 44×44).
  https://adrianroselli.com/2019/06/target-size-and-2-5-5.html · https://frontendchecklist.io/rules/accessibility/touch-targets

---

## 2. tako 적용 후보 표

심플함 비용 = 화면에 새로 보이는 요소·외울 것·설정이 얼마나 늘어나는가.

| # | 패턴 | 참고 서비스 | tako에서의 구체적 모습 | 기대 효과 | 심플함 비용 | 추천도 |
|---|---|---|---|---|---|---|
| 1 | **× 보관을 확인창 → 즉시 실행 + Undo 토스트** | Gmail/Material 스낵바, NN/g 확인창 남용 경고, Keep 휴지통 | ×를 누르면 확인창 없이 행이 사라지고 하단 입력창 위에 "보관함으로 옮겼어요 · 되돌리기" 토스트 4~5초. 되돌리기 누르면 저장 요청 취소/역저장. 영구삭제(Archive 탭)만 확인창 유지 | 탭 1회 감소, 확인창 반사 클릭 습관 방지. 보관은 원래 복구 가능하므로 위험 낮음 | 낮음 (토스트 1개 컴포넌트로 아래 #2·#6에도 재사용) | ★★★ |
| 2 | **완료 체크 시 짧은 지연 후 정렬/이동 + 실행취소** | Things 3(~500ms 애니메이션), Google Tasks 완료 섹션 | 체크하면 즉시 취소선+체크 애니메이션, 정렬 상태라면 0.6~1초 뒤 아래로 이동(바로 튀지 않게). 실수 대비 같은 토스트에 "되돌리기" | 잘못 누른 항목을 눈으로 확인할 시간, 완료의 만족감. 낙관적 업데이트와 궁합 좋음 | 낮음 | ★★★ |
| 3 | **입력창 인라인 우선순위 문법** | Todoist `p1`, TickTick `!` | 입력 텍스트에 `!!!`/`!!`/`!` 또는 `p1~p3`가 있으면 해당 우선순위로 추가하고 기호는 제거. 좌측 순환 버튼은 그대로 두되, 문법이 인식되면 버튼 아이콘이 즉시 바뀌어 미리보기 | PC에서 손을 키보드에서 떼지 않고 분류. 봇 메시지에도 같은 문법을 쓰면 일관 | 낮음 (안 쓰면 안 보임) | ★★★ |
| 4 | **연속 입력 유지** | Todoist `Enter` 저장 후 다음 입력 | 전송 후 입력창 포커스·선택한 우선순위 유지(모바일 키보드가 닫히지 않게). 이미 Enter 추가가 있다면 포커스 유지만 점검 | 여러 개를 쏟아낼 때 마찰 제거 | 낮음 | ★★★ |
| 5 | **PC 단축키 최소 세트** | Todoist(`Q`/`A`, `E`, `Cmd+Z`), Linear(`C`) | `/` 또는 `N`으로 하단 입력창 포커스, `Esc`로 시트 닫기, `Cmd+Z`로 마지막 동작 되돌리기(#1 토스트와 공유). 그 이상은 추가하지 않음 | PC 사용 속도 향상, 화면 변화 없음 | 낮음 | ★★☆ |
| 6 | **Inbox 분류 후 Undo** | Any.do Moment(한 번에 하나씩 분류), Things Inbox | H/M/L 버튼으로 Task로 보낸 직후 "🍅 High로 보냈어요 · 되돌리기" 토스트. 다중 선택 일괄 처리에도 동일 | 분류 실수 복구, 확인창 없이 빠른 분류 | 낮음 | ★★★ |
| 7 | **접힌 부모에 하위 진행률 "2/5"** | Todoist(접힘 시 n/m), Things 체크리스트 | 하위 할 일을 접었을 때만 부모 텍스트 오른쪽에 회색 작은 글씨 `2/5`. 펼치면 숨김. 막대·파이 그래프는 쓰지 않음 | 접어둔 상태에서도 진척 파악 | 낮음 | ★★☆ |
| 8 | **부모 완료 시 하위도 함께 완료** | Apple 미리알림, Todoist | 부모 체크 → 미완료 하위가 있으면 함께 완료(토스트로 되돌리기). 하위 단계는 1단계로 제한 유지(Google Tasks처럼) | 일관된 규칙, 정리 마찰 감소 | 낮음 (규칙만 바뀜) | ★★☆ |
| 9 | **우선순위 색을 체크박스 테두리에 반영** | Todoist(P1 빨강·P2 주황·P3 파랑 체크박스) | 섹션 헤더의 🍅🍋🥝는 유지하고, 행 체크박스 테두리에 옅은 섹션 색(토마토/레몬/키위). 섹션 밖(검색·정렬 등)에서도 우선순위 식별 | 섹션 이동 후에도 시각 단서 유지 | 낮음~중간 (색이 늘어남, 3색만) | ★★☆ |
| 10 | **동기화 상태 pill을 "문제 있을 때만" 강조** | Todoist(오프라인 시에만 아이콘, 미동기화 경고 배너) | 평소엔 pill을 아주 작게/숨김, 저장 실패·오프라인일 때만 빨간 pill + "다시 시도". 미저장 변경이 있을 때 페이지 이탈 시 `beforeunload` 경고 | 평상시 시각 소음 감소, 실패는 확실히 인지 | 낮음 (오히려 요소 감소) | ★★★ |
| 11 | **오프라인 입력 대기열** | Todoist 오프라인 편집 후 자동 동기화 | 네트워크 실패 시 변경을 localStorage 대기열에 두고 재연결 시 순서대로 반영. pill에 "대기 n건" | 지하철 등에서 입력 손실 방지 | 중간 (구현 복잡, UI 비용은 낮음) | ★★☆ |
| 12 | **길게 눌러 드래그(핸들 제거 검토)** | Things 3(길게 누르면 떠오르며 재정렬), Keep 카드 | 모바일에서 행을 길게 누르면(약 350ms, 진동 지원 시 `navigator.vibrate(10)`) 드래그 시작. ⋮⋮ 핸들은 PC 호버 때만 노출 | 행마다 보이던 핸들 제거 → 화면 단순화 | 중간 (발견성 떨어짐, 텍스트 탭=편집과 충돌 주의) | ★★☆ |
| 13 | **터치 타깃 44px 점검** | Apple HIG 44pt, Material 48dp | 체크박스·×·H/M/L 버튼·우선순위 순환 버튼의 실제 히트 영역을 44×44px 이상으로(시각 크기는 그대로, padding으로 확장). ×와 체크박스 간격 확보 | 오탭 감소(특히 ×). 시각 변화 없음 | 낮음 | ★★★ |
| 14 | **빈 상태 한 줄 + 행동 유도** | Things/MS To Do 빈 목록 | Task 섹션이 비면 "🍅 비었어요" 한 줄(회색), Inbox가 비면 "Inbox 정리 완료" 한 줄. 일러스트·통계는 넣지 않음 | 빈 화면이 오류처럼 보이지 않음, 성취감 | 낮음 | ★★☆ |
| 15 | **완료 항목 "완료 n개" 접기** | Google Tasks(Completed 접힘 섹션), Apple "Show Completed" | 각 우선순위 섹션 하단에 완료 항목을 "완료 3" 한 줄로 접어두고 탭하면 펼침(정렬 버튼 대체 가능성 검토) | 미완료에 집중, 정렬 버튼 1개 제거 가능 | 낮음~중간 | ★★☆ |
| 16 | **Memo 고정(pin)** | Google Keep, Apple 메모 | 포스트잇을 길게 눌러/메뉴로 "고정" → 보드 맨 앞 별도 줄. 색·라벨은 추가하지 않음 | 자주 보는 메모 접근성 | 중간 (보드 레이아웃 규칙 추가) | ★☆☆ |
| 17 | **편집 시트 → 행 인라인 편집(텍스트만)** | Things 3 인라인 펼침 | 텍스트 탭 시 PC에선 행 안에서 바로 편집(Enter 저장, Esc 취소), 우선순위 변경이 필요할 때만 시트. 모바일은 현행 시트 유지 | PC 편집 속도 | 중간 (두 가지 편집 방식 공존) | ★☆☆ |
| 18 | **"오늘" 개념(My Day)** | MS To Do My Day, Any.do Moment | (적용 시) High 섹션을 사실상 "오늘"로 간주하고 별도 화면은 만들지 않음 | — | 높음 (새 개념·매일 초기화 규칙) | ★☆☆ (비추천에 가까움) |

### 우선 적용 묶음(제안)
1차: #1·#2·#6(공용 Undo 토스트 하나) + #10 + #13 + #4 → 새 화면 요소는 토스트 1개뿐, 마찰·오조작 체감이 큼.
2차: #3 인라인 문법, #7 진행률, #8 부모 완료 규칙, #14 빈 상태.
보류: #12, #15, #16, #17, #11 — 효과는 있으나 규칙·상태가 늘어나므로 사용 데이터를 보고 결정.

---

## 3. 하지 말아야 할 것 (심플함을 해치는 흔한 기능 과잉)

1. **우선순위 단계 늘리기(P4·없음 추가, 숫자 1~10 등)** — 3단 과일 아이콘이 tako 정체성. Todoist도 기본값 P4 "무색"이 사실상 대다수가 됨.
2. **마감일·알림·반복 일정 도입** — 날짜를 "표시만" 하는 현재 방식이 장점. 알림이 생기면 권한·시간대·스누즈 등 연쇄 기능이 따라옴.
3. **스와이프 제스처 다중 커스터마이즈** — TickTick 공식 블로그조차 "실수로 완료되면 None으로"라고 안내. 스와이프를 넣는다면 한 방향·한 동작(예: 보관 + Undo)만.
4. **라벨/태그/프로젝트/필터/스마트 목록** — 탭 4개 구조를 깨고 분류 고민을 늘림.
5. **확인창 추가** — 되돌릴 수 있는 작업(보관·완료·분류)에 확인창을 더 붙이면 반사 클릭만 늘어남. 확인창은 영구삭제 하나만.
6. **"오늘" 화면·대시보드·통계·스트릭·카르마** — Todoist 카르마, MS To Do My Day 같은 장치는 1인 심플 앱엔 과함.
7. **메모 색상·라벨·체크리스트 혼합** — Keep의 50개 라벨·색 팔레트는 정리 부담이 됨. 노란 포스트잇 단색 유지.
8. **자연어 날짜 자동 인식** — 오인식(텍스트 속 숫자를 날짜로) 위험이 있어 TickTick도 끄는 설정을 둠. tako의 "(~10/21)" 수동 표기를 유지.
9. **하위 할 일 다단계 중첩** — Google Tasks처럼 1단계로 제한하는 편이 모바일 들여쓰기·드래그와 충돌이 적음.
10. **효과음·큰 축하 애니메이션 기본 켜기** — 짧은 체크 애니메이션(+지원 기기 미세 진동)이면 충분.
11. **완료 진행률을 막대·파이·퍼센트로 크게 표시** — 접혔을 때 "2/5" 회색 텍스트면 충분.

---

## 4. 확인하지 못한 것 (후속 확인 필요 시)
- Todoist·Google Tasks 모바일 완료 후 Undo 스낵바의 정확한 지속 시간·문구 (공식 문서 미발견)
- Things 3 완료 후 목록에서 사라지기까지의 지연 시간 (공식 문서 없음, 디자인 분석 글 수치만 있음)
- Linear 생성 모달의 "Create more" 연속 생성 토글 (공식 문서에 언급 없음)
- Material 3 스낵바 공식 페이지 본문(페치 실패, 보조 출처로 대체)
- Apple HIG 44pt 원문 페이지(페치 실패, 접근성 전문 글로 대체)
