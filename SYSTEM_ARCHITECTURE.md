# Green Signal 시스템 아키텍처 (System Architecture)

현재 프로젝트의 전체적인 구조와 데이터 흐름, 그리고 외부 연동 시스템까지 포함한 상세 아키텍처입니다.

## 1. 개요 (Overview)

이 시스템은 사용자가 안드로이드 앱(React 기반)을 통해 식품 정보를 조회하고, AI 기반 추천을 받을 수 있는 서비스입니다.

---

## 2. 전체 데이터 흐름도 (Full Architecture)

```mermaid
graph TD
    subgraph "External Systems (외부 연동)"
        OAuth[소셜 로그인]:::ext
        HACCP[HACCP 공공데이터]:::ext
    end

    subgraph "Client Side (사용자 영역)"
        User((User))
        Android[Android App\n(React + Capacitor)]:::app
        Camera[Camera / GPS]:::hw
    end

    subgraph "Server Side (서버 영역)"
        Node[Node.js Server\n(Express)]:::main
        Flask[AI Python Server\n(Flask)]:::ai
        DB[(MySQL DB)]:::db
    end

    %% Data Flow
    User -->|터치/입력| Android
    Android -->|바코드 스캔| Camera
    Camera -->|바코드 데이터| Android

    Android <-->|API 요청/응답| Node

    %% 소셜 로그인 흐름
    Node <-->|인증 요청| OAuth

    %% 데이터베이스 흐름
    Node <-->|SQL 쿼리| DB

    %% AI 추천 흐름
    Node <-->|추천 데이터 요청| Flask
    Flask -.->|학습 데이터 조회| DB

    %% 데이터 파이프라인
    HACCP -.->|CSV 데이터 수집| Node
    Node -.->|데이터 적재 (Batch)| DB

    classDef main fill:#f9f,stroke:#333,stroke-width:2px;
    classDef ai fill:#ccf,stroke:#333,stroke-width:2px;
    classDef db fill:#ff9,stroke:#333,stroke-width:2px;
    classDef app fill:#9f9,stroke:#333,stroke-width:2px;
    classDef ext fill:#ddd,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5;
    classDef hw fill:#fff,stroke:#333,stroke-width:1px;
```

---

## 3. 세부 구성 요소 및 곁가지 (Detailed Components)

### 🅰️ 주요 시스템 (Main Branch)

1.  **Client (Android App)**
    - **React**: 화면 UI 구성.
    - **Capacitor**: 웹 코드를 안드로이드 앱으로 변환하고, **카메라(바코드 스캔)** 등 하드웨어 기능에 접근하는 다리 역할.
2.  **Node.js Server (Backend)**
    - 앱과 통신하는 메인 서버. 로그인 세션 관리, DB 조회 등을 담당.
3.  **MySQL (Database)**
    - 사용자 정보, 상품 데이터(5만 건 이상), 알러지 정보를 저장하는 핵심 저장소.

### 🅱️ 곁가지 시스템 (Side Branches)

메인 흐름을 도와주는 외부 연동 및 보조 기능들입니다.

#### 1. 소셜 로그인 (Social Auth)

- **Kakao / Google**: 사용자가 아이디/비번을 새로 만들지 않고 기존 계정으로 로그인할 수 있도록 돕습니다.
- **Passport.js**: Node.js 서버에서 이 소셜 로그인 처리를 담당하는 중개자입니다.

#### 2. 데이터 수집 파이프라인 (Data Pipeline)

- **HACCP 공공데이터**: 상품 정보의 원천(Source)입니다.
- **CSV Import Script**: 공공데이터에서 받은 엑셀(CSV) 파일을 읽어서, 우리 DB(MySQL)에 자동으로 집어넣는 프로그램입니다. (`import_csv.js` 등)
- _이 과정은 앱 실행 중이 아니라, 사전에 데이터를 채워넣을 때 수행됩니다._

#### 3. AI 추천 엔진 (Intelligence)

- **Python Flask**: Node.js가 "이 사람한테 뭘 추천할까?"라고 물어보면, 미리 학습된 모델(TF-IDF)을 돌려 "새우깡" 같은 결과를 뱉어줍니다.
- _Node.js의 보조 두뇌 역할을 수행합니다._
