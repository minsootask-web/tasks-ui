// UX 실험실 전용 서비스워커 — 아무것도 캐시하지 않는다.
// 본 서비스(../sw.js)는 scope가 상위 폴더라 /lab/까지 가로채 옛 lab 파일을 보여 줄 수 있다.
// 더 좁은 scope(./)로 이 워커를 등록하면 /lab/ 아래는 이 워커가 맡는다. 본 서비스 워커는 건드리지 않는다.
// lab 파일(index.html·mock-github.js 등)은 브라우저 HTTP 캐시도 거치지 않고 늘 서버에서 새로 받는다
// (고친 mock이 캐시 때문에 안 바뀌어 보이는 일 방지).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || e.request.method !== 'GET') return;
  if (!url.pathname.includes('/lab/')) return;
  e.respondWith(fetch(e.request, { cache: 'no-store' }));
});
