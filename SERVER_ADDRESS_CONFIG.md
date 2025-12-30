# 서버 주소 변경 가이드 (Localhost ↔ IP Address)

이 문서는 개발 환경을 **로컬 전용(localhost)**과 **외부 접속(안드로이드/팀원)** 모드로 전환할 때 수정해야 할 파일 목록입니다.

현재 설정된 IP: `192.168.219.74` (안드로이드 연결 가능)
원상 복구(로컬) 시: `localhost`

---

## 1. 백엔드 API 연결 주소 (Node.js 서버)

아래 파일들에서 `http://192.168.219.74:3000` 부분을 찾아 `http://localhost:3000`으로 변경하세요.

1.  **frontend/src/api/axiosInstance.js**
    - `baseURL` 설정 부분
2.  **frontend/src/components/lib/db.js**
    - `this.apiUrl` 설정 부분
3.  **frontend/src/lib/api.js**
    - `BASE` 변수 설정 부분
4.  **frontend/src/pages/FindAccountPage.jsx**
    - `API` 변수 설정 부분
5.  **frontend/src/pages/AdminPage.jsx**
    - `axios.get`, `post`, `delete` 요청 주소 (총 3군데)
6.  **frontend/src/components/ProductDetailMain.jsx**
    - `fetchProduct` 함수 내부의 `check-safety` API 호출 주소
    - `RecommendationList` 컴포넌트 내부의 `recommend` API 호출 주소
7.  **frontend/src/components/AuthModal.jsx**
    - `API` 변수 설정 부분 (`http://192.168.219.74:3000`)
8.  **frontend/src/pages/RegisterPage.jsx**
    - `handleOAuth` 함수 내부의 소셜 로그인 주소 (`http://192.168.219.74:3000`)

---

## 2. 프론트엔드 호스팅 설정 (안드로이드 Dev Server)

안드로이드 앱이 PC의 개발 서버 화면을 띄우게 하거나, 빌드된 파일만 쓰게 하려면 아래를 수정하세요.

1.  **frontend/vite.config.js**
    - **외부 접속 차단 시**: `server: { host: '0.0.0.0' }` 라인을 삭제하거나 주석 처리하세요.
2.  **frontend/capacitor.config.json**
    - **빌드 버전(배포용)으로 실행 시**: 아래 `server` 블록 전체를 삭제하세요.
      ```json
      "server": {
        "url": "http://192.168.219.74:5173",
        "cleartext": true
      }
      ```
    - _주의: 이 파일을 수정하면 반드시 `npx cap sync android` 명령어를 실행해야 반영됩니다._
