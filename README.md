# tasks-ui

`tasks-data` private repo의 `active.md`를 모든 기기에서 CRUD할 수 있는 PWA.

GitHub Pages 로 호스팅 → 모바일에서 홈 화면에 추가하여 앱처럼 사용.

## 데이터 흐름

```
[iPhone/Android/Mac/PC] ── HTTPS ──> GitHub Pages (this repo)
                                       ↓ JS fetch
                          GitHub Contents API (api.github.com)
                                       ↓
                          tasks-data (private repo, active.md)
```

## 초기 설정

1. PWA 열기 → fine-grained PAT 입력 (1회)
2. iOS Safari → 공유 → 홈 화면에 추가
3. 끝.

PAT 발급 가이드는 앱 안에 표시됩니다.

## 파일 구성

- `index.html` — 메인 앱 (CSS, JS 내장)
- `manifest.json` — PWA manifest
- `sw.js` — service worker (정적 자원 캐시)
- `icon-*.png`, `apple-touch-icon.png` — 아이콘
- `make_icons.py` — 아이콘 재생성 스크립트
