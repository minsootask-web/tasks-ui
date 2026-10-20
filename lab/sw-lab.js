// UX 실험실 전용 서비스워커 — 아무것도 캐시하지 않는다.
// 본 서비스(../sw.js)는 scope가 상위 폴더라 /lab/까지 가로채 옛 lab 파일을 보여 줄 수 있다.
// 더 좁은 scope(./)로 이 빈 워커를 등록하면 /lab/ 아래는 이 워커가 맡고, 요청은 그대로 네트워크로 간다.
// fetch 핸들러를 두지 않으므로 브라우저가 바로 네트워크를 쓴다. 본 서비스 워커는 건드리지 않는다.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
