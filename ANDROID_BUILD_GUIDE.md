# 안드로이드 앱 변환 및 빌드 가이드

현재 프로젝트는 Capacitor가 적용되어 있어, 아래 절차를 통해 안드로이드 앱으로 변환하고 실행할 수 있습니다.

## 1. 개발용 실행 (Live Reload)

**현재 설정 상태입니다.** PC에서 코드를 수정하면 앱에도 즉시 반영됩니다.

- **조건**: PC와 휴대폰이 **동일한 와이파이**에 연결되어 있어야 하며, PC에서 `npm run dev`가 실행 중이어야 합니다.

**실행 순서:**

1.  `frontend` 폴더에서 터미널 열기
2.  동기화 명령 실행:
    ```bash
    npx cap sync
    ```
3.  안드로이드 스튜디오 열기:
    ```bash
    npx cap open android
    ```
4.  안드로이드 스튜디오가 열리면, 상단의 **초록색 재생 버튼(Run)**을 눌러 휴대폰(또는 에뮬레이터) 앱을 실행합니다.

---

## 2. 배포용 APK 만들기 (완전한 앱 파일)

PC 서버 연결 없이, 앱만 단독으로 설치해서 쓰고 싶을 때 사용합니다. (최종 제출/배포용)

**실행 순서:**

1.  **설정 변경**: `frontend/capacitor.config.json` 파일에서 아래 `server` 부분을 **삭제**합니다.
    ```json
    // 이 부분을 지우세요!
    "server": {
      "url": "http://192.168.219.74:5173",
      "cleartext": true
    }
    ```
2.  **프론트엔드 빌드**: (터미널 `frontend` 폴더에서)
    ```bash
    npm run build
    ```
3.  **동기화**:
    ```bash
    npx cap sync
    ```
4.  **APK 추출**:
    - `npx cap open android` 명령어로 안드로이드 스튜디오 실행.
    - 상단 메뉴: `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)` 클릭.
    - 완료되면 우측 하단 알림창의 `locate`를 눌러 `.apk` 파일을 찾을 수 있습니다.

---

## 💡 자주 발생하는 문제

- **앱이 흰 화면만 나올 때**: 개발용 모드인데 PC 서버(`npm run dev`)가 꺼져 있거나, 와이파이가 다를 때 발생합니다.
- **Network Error**: 백엔드 서버(`node server.js`)가 꺼져 있거나, IP 주소가 잘못 설정되었을 때 발생합니다. (`SERVER_ADDRESS_CONFIG.md` 참고)
