# 사용 모듈 및 라이브러리 목록 (Modules & Libraries)

본 문서는 "Green Signal" 프로젝트의 프론트엔드, 백엔드, AI 서버, 그리고 하이브리드 앱 빌드에 사용된 주요 오픈소스 라이브러리와 모듈을 정리한 파일입니다.

## 1. Frontend (React)

|      구분       |    라이브러리명 (Package)    | 버전 (Version) | 용도 및 설명                                                      |
| :-------------: | :--------------------------: | :------------: | :---------------------------------------------------------------- |
|    **Core**     |     `react`, `react-dom`     |      v18+      | UI 컴포넌트 구축을 위한 핵심 라이브러리.                          |
| **Build Tool**  |            `vite`            |      v6+       | 빠르고 가벼운 프론트엔드 빌드 도구 (Hot Module Replacement 지원). |
|   **Routing**   |      `react-router-dom`      |      v6+       | SPA(Single Page Application) 페이지 라우팅 및 네비게이션 관리.    |
| **HTTP Client** |           `axios`            |       -        | 백엔드 API와의 비동기 데이터 통신.                                |
|  **UI/Icons**   |          `boxicons`          |       -        | 직관적인 아이콘 사용을 위한 라이브러리.                           |
|   **Utility**   |        `html5-qrcode`        |       -        | 웹 카메라를 이용한 실시간 바코드 스캔 기능 구현.                  |
|    **State**    | `zustand` (또는 Context API) |       -        | (일부 사용) 전역 상태 관리.                                       |

---

## 2. Backend (Node.js)

|     구분     |           라이브러리명 (Package)            | 버전 (Version) | 용도 및 설명                                                   |
| :----------: | :-----------------------------------------: | :------------: | :------------------------------------------------------------- |
|  **Server**  |                  `express`                  |       -        | 경량화된 웹 서버 프레임워크. API 라우팅 처리.                  |
| **Database** |                  `mysql2`                   |       -        | MySQL 데이터베이스 연결을 위한 비동기 드라이버 (Promise 지원). |
|   **Auth**   |        `passport`, `passport-local`         |       -        | 사용자 인증(로그인) 미들웨어.                                  |
|  **OAuth**   | `passport-google-oauth20`, `passport-kakao` |       -        | 소셜 로그인(구글, 카카오) 구현.                                |
| **Security** |                   `cors`                    |       -        | Cross-Origin Resource Sharing 설정 (프론트/백엔드 통신 허용).  |
| **Session**  |              `express-session`              |       -        | 사용자 세션 관리.                                              |
|   **Env**    |                  `dotenv`                   |       -        | 환경 변수(.env) 보안 관리.                                     |

---

## 3. Hybrid App (Mobile)

|     구분     |         라이브러리명 (Package)         | 버전 (Version) | 용도 및 설명                                            |
| :----------: | :------------------------------------: | :------------: | :------------------------------------------------------ |
| **Runtime**  |           `@capacitor/core`            |      v5+       | 웹 앱을 네이티브 앱(Android/iOS)으로 패키징하는 런타임. |
|   **CLI**    |            `@capacitor/cli`            |      v5+       | Capacitor 프로젝트 생성 및 관리 명령어 도구.            |
| **Platform** |          `@capacitor/android`          |      v5+       | Android 플랫폼 지원 모듈.                               |
|  **Plugin**  | `@capacitor-community/barcode-scanner` |   (Optional)   | 네이티브 카메라 권한을 사용하는 바코드 스캐너 플러그인. |

---

## 4. AI & Data Processing (Python/Flask)

|       구분        |    라이브러리명 (Package)    | 버전 (Version) | 용도 및 설명                                                 |
| :---------------: | :--------------------------: | :------------: | :----------------------------------------------------------- |
|    **Server**     |           `Flask`            |       -        | 파이썬 기반 마이크로 웹 프레임워크 (추천 API 서버).          |
| **Data Analysis** |           `pandas`           |       -        | 데이터프레임 조작, CSV 처리, 데이터 정제.                    |
|     **ML/AI**     |        `scikit-learn`        |       -        | 코사인 유사도(Cosine Similarity) 계산 등 추천 알고리즘 구현. |
|    **Crawler**    | `requests`, `BeautifulSoup4` |       -        | 웹 크롤링 및 HTML 파싱 (데이터 수집용).                      |
|   **Interface**   |         `flask-cors`         |       -        | 플라스크 서버의 CORS 정책 설정.                              |

---

## 5. Database

- **MySQL 8.0**: 사용자 정보, 제품 데이터, 알레르기/질병 매핑 정보 저장.

## 6. Development Tools

- **VS Code**: 통합 개발 환경 (IDE).
- **Postman**: API 테스트 도구.
- **Android Studio**: Android APK 빌드 및 에뮬레이터 테스트.
