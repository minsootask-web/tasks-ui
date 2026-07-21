// 정적 아이콘은 cache-first, HTML/스크립트는 network-first.
// 새 배포는 일반 새로고침으로도 즉시 반영된다.
const CACHE = "tasks-v9";
const ASSETS = [
  "./manifest.json",
  "./favicon.svg",
  "./favicon-48.png",
  "./favicon-32.png",
  "./favicon-16.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // GitHub API는 절대 캐시 안 함
  if (url.host === "api.github.com") return;
  // 같은 origin 만 처리
  if (url.origin !== self.location.origin) return;

  // HTML 문서 / 루트 / sw.js 자체 → network-first (옛 캐시 안 보여줌)
  const isDocument =
    e.request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith("/sw.js");

  if (isDocument) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 정적 자원은 cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return (
        cached ||
        fetch(e.request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
      );
    })
  );
});
