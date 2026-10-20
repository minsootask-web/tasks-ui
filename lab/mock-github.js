// UX 실험실 전용 가짜 GitHub Contents API.
// 실제 tasks-data에는 절대 접근하지 않고, 이 브라우저의 localStorage에만 읽고 쓴다.
// 본 서비스(index.html)에는 포함하지 않는다.
(function () {
  'use strict';
  var NS = 'tako_lab_mock_';
  var LATENCY = 350; // 실제 API 왕복과 비슷한 지연 — 낙관적 업데이트·저장 표시 검증용

  var today = new Date();
  function ymd(offset) {
    var d = new Date(today); d.setDate(d.getDate() + offset);
    return (d.getMonth() + 1) + '/' + d.getDate();
  }

  var SEED = {
    'active.md': [
      '# Active — 진행 중',
      '',
      '> 우선순위가 매겨진 실제 진행 항목.',
      '',
      '## 🔥 High',
      '- [ ] 분기 보고서 초안 작성 (~' + ymd(1) + ')',
      '  - [x] 지난 분기 수치 정리',
      '  - [ ] 차트 3개 만들기',
      '  - [ ] 팀장님 검토 요청',
      '- [ ] 디자인 리뷰 피드백 반영 — 버튼 크기, 여백',
      '- [x] 서버 점검 공지 확인',
      '- [ ] 신규 입사자 온보딩 자료 업데이트 (https://example.com/onboarding)',
      '',
      '## 🟡 Medium',
      '- [ ] 치과 예약 (' + ymd(3) + ')',
      '- [ ] 주간회의 안건 정리',
      '  - [ ] 채용 일정 공유',
      '  - [ ] 워크숍 장소 투표',
      '- [x] 노트북 OS 업데이트',
      '- [ ] 책 「함께 자라기」 3장까지 읽기',
      '- [ ] 경비 정산 영수증 올리기',
      '',
      '## 🟢 Low',
      '- [ ] 책상 정리',
      '- [ ] 사진 백업',
      '- [x] 구독 서비스 정리',
      '',
    ].join('\n'),
    'inbox.md': [
      '# Inbox — 새로 들어온 할 일',
      '',
      '> 떠오르는 대로 자유롭게 적어두면 정리해서 active로 옮깁니다.',
      '',
      '- 다음 주 출장 숙소 알아보기',
      '- 엄마 생신 선물 고르기',
      '- 회의록 템플릿 개선 아이디어',
      '',
    ].join('\n'),
    'archive.json': JSON.stringify([
      { id: 'seed-a1', deletedAt: new Date(Date.now() - 864e5).toISOString(), source: 'active', priority: 'high', block: ['- [x] 프로젝트 킥오프 자료 준비', '  - [x] 일정표'] },
      { id: 'seed-a2', deletedAt: new Date(Date.now() - 3 * 864e5).toISOString(), source: 'inbox', text: '헬스장 등록 알아보기' },
      { id: 'seed-a3', deletedAt: new Date(Date.now() - 9 * 864e5).toISOString(), source: 'active', priority: 'low', block: ['- [x] 우산 사기'] },
    ], null, 2) + '\n',
    'memos.json': JSON.stringify([
      { id: 'seed-m1', text: '회의 메모\n- 다음 릴리스는 금요일\n- QA는 수요일까지', col: 0, order: 0 },
      { id: 'seed-m2', text: '와이파이 비번: 손님용 게스트망 사용', col: 1, order: 0 },
      { id: 'seed-m3', text: '읽을 책\n- 함께 자라기\n- 디자인의 디자인', col: 2, order: 0 },
      { id: 'seed-m4', text: '아이디어: 주말 아침 루틴 만들기', col: 0, order: 1 },
    ], null, 2) + '\n',
  };

  function utf8ToBase64(str) {
    var bytes = new TextEncoder().encode(str); var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function base64ToUtf8(b64) {
    var bin = atob(b64.replace(/\s/g, '')); var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  function sha(s) { // 내용 기반 가짜 sha
    var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return 'mock' + (h >>> 0).toString(16) + s.length.toString(16);
  }
  function read(file) {
    try { var v = localStorage.getItem(NS + file); if (v != null) return v; } catch (e) {}
    return SEED[file] != null ? SEED[file] : null;
  }
  function write(file, content) { try { localStorage.setItem(NS + file, content); } catch (e) {} }

  function respond(status, body) {
    return new Promise(function (res) {
      setTimeout(function () {
        res(new Response(JSON.stringify(body), { status: status, headers: { 'Content-Type': 'application/json' } }));
      }, LATENCY);
    });
  }

  // 실패 주입 규칙.
  //   __takoMockFail = true                         → 모든 PUT 500 (기존 동작)
  //   __takoMockFail = { file, method, times, status, offline }
  //   __takoMockFail = [ 규칙, 규칙 … ]               → 첫 번째로 맞는 규칙 적용
  //   file 생략 = 모든 파일, method 생략 = 'PUT', times 생략 = 무제한(숫자면 그 횟수만 실패 후 해제)
  //   offline: true 이면 응답 대신 네트워크 오류(TypeError)
  function matchFailRule(file, method) {
    var f = window.__takoMockFail;
    if (!f) return null;
    if (f === true) return method === 'PUT' ? { status: 500 } : null;
    var rules = Array.isArray(f) ? f : [f];
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (!r) continue;
      if (r.file && r.file !== file) continue;
      if ((r.method || 'PUT').toUpperCase() !== method && r.method !== '*') continue;
      if (typeof r.times === 'number') {
        if (r.times <= 0) continue;
        r.times--;
      }
      return r;
    }
    return null;
  }

  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input.url;
    var m = /^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\/(.+)$/.exec(url);
    if (!m) {
      if (/api\.github\.com/.test(url)) return respond(404, { message: 'mock: unsupported' });
      return realFetch(input, init);
    }
    var file = decodeURIComponent(m[1]);
    var method = (init && init.method || 'GET').toUpperCase();
    window.__takoMockLog.push({ t: Date.now(), method: method, file: file });
    var rule = matchFailRule(file, method);
    if (rule) {
      if (rule.offline) {
        return new Promise(function (res, rej) { setTimeout(function () { rej(new TypeError('Failed to fetch')); }, LATENCY); });
      }
      return respond(rule.status || 500, { message: 'mock: forced failure' });
    }
    var cur = read(file);
    if (method === 'GET') {
      if (cur == null) return respond(404, { message: 'Not Found' });
      return respond(200, { sha: sha(cur), content: utf8ToBase64(cur) });
    }
    if (method === 'PUT') {
      var body = JSON.parse(init.body || '{}');
      if (cur != null && body.sha !== sha(cur)) return respond(409, { message: 'sha mismatch' });
      var next = base64ToUtf8(body.content);
      write(file, next);
      return respond(200, { content: { sha: sha(next) } });
    }
    return respond(405, { message: 'mock: method' });
  };

  // 실험실은 토큰 없이 바로 열린다(실제 토큰은 쓰지도 보내지도 않는다).
  try { if (!localStorage.getItem('gh_pat')) localStorage.setItem('gh_pat', 'lab-mock-token'); } catch (e) {}

  // 콘솔·QA용 도우미: __takoMockReset() 샘플 데이터 초기화 · __takoMockFail 실패 주입(위 규칙)
  // · __takoMockExternalWrite 외부 작성자 흉내 · __takoMockLog/__takoMockPuts 요청 기록 · __takoMockRead 저장소 내용
  // 요청 기록 — 체크 연타가 PUT 1번으로 묶이는지 등 확인용. __takoMockLog.length = 0 으로 비움
  window.__takoMockLog = [];
  window.__takoMockPuts = function (file) {
    return window.__takoMockLog.filter(function (r) { return r.method === 'PUT' && (!file || r.file === file); }).length;
  };
  // 다른 작성자(봇·다른 기기)가 사이에 파일을 바꾼 상황 흉내 — 다음 앱 저장이 409를 받는다.
  //   __takoMockExternalWrite('inbox.md', function (c) { return c + '- 봇이 넣은 항목\n'; })
  window.__takoMockExternalWrite = function (file, fn) {
    var cur = read(file);
    var next = fn(cur == null ? '' : cur);
    write(file, next);
    return next;
  };
  window.__takoMockRead = function (file) { return read(file); };

  window.__takoMockReset = function () {
    Object.keys(SEED).forEach(function (f) { try { localStorage.removeItem(NS + f); } catch (e) {} });
    location.reload();
  };
})();
