# 프로젝트 트러블슈팅 로그 (Troubleshooting Log)

본 문서는 "Green Signal" 프로젝트 개발 및 APK 빌드 과정에서 발생한 주요 오류와 그 해결 과정을 정리한 파일입니다.

---

## 🏗️ Android APK 빌드 및 배포 관련

### 1. Android Studio "Build APK" 메뉴 미노출

- **현상:** Android Studio 상단 Build 메뉴에 'Build APK' 옵션이 보이지 않거나 비활성화됨.
- **원인:** 프로젝트 열기(Open) 시 `frontend` 폴더 전체를 열었기 때문에, Studio가 이를 Android 프로젝트로 인식하지 못함.
- **해결:** `File > Open` 경로에서 반드시 **`frontend/android`** 폴더를 선택하여 열도록 안내. Gradle Sync 완료 후 메뉴 활성화됨.

### 2. JDK(Java) 미설치로 인한 터미널 빌드 실패

- **현상:** 터미널에서 `npx cap run android` 또는 `gradlew` 실행 시 `javac` 명령어를 찾을 수 없다는 에러 발생.
- **원인:** PC에 Java Development Kit (JDK)가 설치되어 있지 않거나 환경 변수 설정이 안 됨.
- **해결:** 터미널 빌드 대신 **Android Studio** 내장 기능을 이용하여 빌드하도록 가이드 (Studio는 자체 JDK 내장).

### 3. Gradle `flatDir` 경고 (Warning)

- **현상:** 빌드 로그에 `Using flatDir should be avoided...`라는 노란색 경고 문구 출력.
- **원인:** Capacitor 기본 템플릿이 사용하는 오래된 방식의 라이브러리 경로 설정 때문이나, 최신 Gradle에서는 권장하지 않음.
- **해결:** 이는 **단순 경고(Warning)**일 뿐 빌드 실패(Error)의 원인이 아니므로 무시하도록 안내. (실제 빌드 실패 원인은 다른 곳에 있었음)

### 4. 앱 실행 시 흰 화면 (Blank Screen)

- **현상:** 앱 설치 후 실행했을 때 아무 내용도 뜨지 않고 흰 화면만 지속됨.
- **원인:** Vite의 기본 빌드 설정이 절대 경로(`/assets/...`)를 사용하는데, Capacitor 앱은 `file://` 프로토콜을 사용하므로 경로를 찾지 못함.
- **해결:** `vite.config.js`에 `base: './'` 옵션을 추가하여 상대 경로를 사용하도록 수정.

### 5. `npx cap init` 명령어 파싱 에러

- **현상:** Windows PowerShell에서 `&&` 연산자를 사용한 명령어(`npm install && npx cap...`) 실행 시 에러 발생.
- **원인:** PowerShell은 Cmd와 달리 `&&` 연산자를 지원하지 않음 (버전에 따라 다름).
- **해결:** 명령어를 하나씩 분리하여 순차적으로 실행 (`npm install` -> `npm run build` 등).

---

## 🌐 네트워크 및 통신 (Connectivity)

### 6. Android 앱에서 데이터 로딩 실패 (`localhost` 접속 불가)

- **현상:** 앱은 실행되지만 로그인이나 데이터 조회 시 `Network Error` 또는 무반응.
- **원인:** Android 기기(에뮬레이터/실물 폰)에서 `localhost`는 기기 자신을 의미함. PC의 서버(`localhost:3000`)에 접근 불가.
- **해결:**
  - 백엔드 API 주소를 `localhost`에서 개발 PC의 실제 IP인 **`192.168.219.74`**로 전면 수정.
  - 대상 파일: `db.js`, `AuthModal.jsx`, `ProductDetailMain.jsx`, `search.jsx`, `vite.config.js`.

### 7. 백엔드 서버 접속 거부 (Connection Refused)

- **현상:** IP 주소를 변경했음에도 불구하고 외부(폰)에서 접속이 안 됨.
- **원인:** Node.js 서버(`server.js`)가 기본적으로 로컬 루프백(`localhost` / `127.0.0.1`)만 리스닝하거나, 윈도우 방화벽이 차단함.
- **해결:**
  - `server.js`의 `app.listen()` 코드를 수정하여 **`0.0.0.0`** (모든 인터페이스)으로 바인딩.
  - 윈도우 방화벽에서 Node.js의 인바운드 접속 허용 설정.

### 8. HTTP 통신 차단 (Cleartext Traffic Error)

- **현상:** IP 주소로 접속 시도 시 `net::ERR_CLEARTEXT_NOT_PERMITTED` 에러 발생.
- **원인:** Android 9(Pie) 이상부터는 보안을 위해 HTTPS가 아닌 HTTP(평문) 통신을 기본적으로 차단함.
- **해결:** `AndroidManifest.xml`의 `<application>` 태그에 **`android:usesCleartextTraffic="true"`** 속성 추가.

---

## ⚙️ 기능 및 로직 (Logic & Features)

### 9. 바코드 스캐너 작동 불가

- **현상:** 바코드 스캔 버튼을 눌러도 카메라가 켜지지 않음.
- **원인:** 안드로이드 권한 설정 누락.
- **해결:** `AndroidManifest.xml`에 **`<uses-permission android:name="android.permission.CAMERA" />`** 권한 추가.

### 10. 알레르기/질병 위험 미감지

- **현상:** '1A등급 원유', '액상과당' 등이 포함된 제품임에도 경고가 뜨지 않음.
- **원인:** DB의 정형화된 데이터(`product_allergens`)에만 의존하여, 텍스트로 적힌 세부 성분을 놓침.
- **해결:** 백엔드(`product.js`)에 정밀 분석 로직 추가.
  - **알레르기:** '원유', '탈지유', '글루텐' 등 파생 키워드 매핑 추가.
  - **당뇨:** 원재료명(`설탕`, `시럽` 등) 및 영양성분(`당류`, `탄수화물`) 텍스트 파싱 로직 구현.

### 11. CSS 스타일 호환성 및 깨짐

- **현상:** Safari(iOS) 등 일부 환경에서 Glassmorphism(블러) 효과 미적용 및 한글 주석 깨짐.
- **원인:** `backdrop-filter`의 벤더 접두사(`-webkit-`) 누락 및 인코딩 문제.
- **해결:** CSS 파일에 `-webkit-backdrop-filter` 추가 및 UTF-8 인코딩으로 수정, 파일 정리.

---

## 🕰️ 초기 개발 및 데이터 처리 단계 (Early Stage & Data Processing)

### 12. React-MySQL 연동 및 모듈 오류

- **현상:** React 프론트엔드에서 `mysql2` 모듈을 직접 import 하려다 'Module not found' 또는 브라우저 호환성 에러 발생.
- **원인:** `mysql2`는 Node.js 환경에서만 동작하는 라이브러리로, 브라우저(클라이언트)에서 직접 DB 접속 불가.
- **해결:** 백엔드(Node.js/Express) API 서버를 구축하고, 프론트엔드는 `fetch`를 통해 API를 호출하도록 구조 변경 (`db.js`를 API Wrapper로 변경).

### 13. 한글 폰트 및 문자 깨짐 (Encoding Issue)

- **현상:** `Login.jsx`, `RegisterModal.jsx` 등 프론트엔드 화면에서 한글이 '?????', 'ÀÚ' 등으로 깨져 보임.
- **원인:** 파일 인코딩이 EUC-KR 또는 ANSI로 저장되어 있었거나, 리액트가 UTF-8로 인식하지 못함.
- **해결:** VS Code에서 모든 해당 파일의 인코딩을 **UTF-8 with BOM** 또는 **UTF-8**로 변환하여 재저장 및 한글 주석/텍스트 복구.

### 14. 로그인 컴포넌트 리팩토링 실패 및 롤백

- **현상:** `AuthModal` 도입 등 로그인 구조를 대대적으로 변경하던 중, 기존 기능까지 동작하지 않고 파일이 뒤섞임.
- **원인:** 여러 파일(`NewLogin.jsx`, `AuthInput.jsx` 등)을 한꺼번에 생성/수정하면서 의존성이 꼬임.
- **해결:** 문제가 발생하기 전 시점의 `Login.jsx`로 코드를 **원복(Rollback)** 하고, 불필요한 신규 파일들을 삭제 또는 백업(`bk/`) 폴더로 이동.

### 15. Pandas DataFrame 데이터 분할 오류

- **현상:** Python(`분할 copy.ipynb`)에서 `raw_material` 컬럼을 기준으로 데이터를 나누려는데 `KeyError` 또는 포맷 에러 발생.
- **원인:** 해당 컬럼에 딕셔너리 형태의 문자열(`"{...}"`)이 들어있어 바로 파싱되지 않음.
- **해결:** `ast.literal_eval` 등을 사용하여 문자열을 딕셔너리로 변환한 후, 키(Key) 값을 추출하여 별도 컬럼으로 분리하고 처리.

### 16. 웹 크롤러 차단 및 속도 저하

- **현상:** `Koreannet` 사이트에서 상품 상세 페이지를 하나씩 순회하며 크롤링할 때 속도가 매우 느리고 IP 차단 발생.
- **원인:** 너무 잦은 요청과 상세 페이지 접근 방식의 비효율성.
- **해결:** 상세 페이지 진입을 건너뛰고, **목록 페이지(List Page)** 에서 필요한 정보(바코드, 이미지 등)를 바로 추출하는 방식으로 변경하여 속도 개선 및 차단 회피.

### 17. CSS 'Unknown Word' 및 순서 오류

- **현상:** `Sidebar.css` 등에서 글래스모피즘 효과 적용 시 빌드 워닝 또는 스타일 미적용.
- **원인:** `backdrop-filter` 속성 앞에 벤더 프리픽스(`-webkit-`)의 순서가 잘못되었거나, 표준 문법이 아님.
- **해결:** 표준 속성을 뒤에 배치하고, `-webkit-` 프리픽스를 먼저 선언하여 브라우저 호환성 및 문법 오류 해결.
