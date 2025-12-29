# 프로젝트 작업 내역 및 기능 명세서

## 1. 개요

본 문서는 "Green Signal" 프로젝트의 최근 작업 내역, 주요 기능 변경 사항, 그리고 Android APK 생성을 위한 설정 내용을 정리합니다.

## 2. 작업 기간

- 2025년 12월 29일 (최근 세션 기준)

## 3. 주요 변경 사항

### 3.1. 제품 상세 페이지(UI/UX 개선)

- **위치:** `frontend/src/components/ProductDetailMain.jsx`
- **파일명:** `ProductDetailMain.jsx`, `ProductDetailMain.css`, `dar.css`
- **내용:**
  - **정보 재배치:** '⚠️ 주의 정보' 및 '🚨 알레르기 주의 카드'를 제품 상세 스펙(분류, 바코드 등)보다 최상단에 배치하여 사용자 위험 정보를 우선적으로 노출.
  - **경고 메시지 고도화:**
    - **알레르기:** 로그인한 사용자의 알레르기 정보와 제품 성분이 일치할 경우 빨간색 경고 카드 표시.
    - **당뇨:** 사용자 질병 정보에 '당뇨'가 포함된 경우, 원재료(설탕, 과당 등) 및 영양성분(당류, 탄수화물) 분석 결과에 따라 'WARN' 레벨 경고 표시.
  - **디자인 개선:** 카드 UI에 Glassmorphism(투명 글래스) 효과 적용, 테두리 및 그림자 미세 조정으로 가시성 확보.
  - **중복 제거:** 불필요한 'HACCP', '알레르기 주의' 배지 중복 표시를 제거하고 통합 카드로 일원화.

### 3.2. 백엔드 경고 로직 강화 (정밀 분석)

- **위치:** `backend/routes/product.js`
- **내용:**
  - **당뇨 환자 보호:**
    - DB에 감미료 정보가 없더라도, 원재료명 텍스트(`raw_materials_text`)를 실시간 분석하여 혈당 상승 유발 성분(설탕, 액상과당, 덱스트린, 꿀, 시럽 등) 감지.
    - 영양성분 텍스트(`nutrient_text`)에서 '당류' 포함 여부 확인.
    - 당뇨 환자에게는 경고(WARN) 레벨로, 일반 사용자에게는 정보(INFO) 레벨로 차등 표시.
  - **알레르기 정밀 탐지:** (우유, 대두, 밀 등)
    - DB 알레르기 매핑 외에, 원재료명 텍스트에서 '유크림', '1A등급 원유', '글루텐', '탈지유' 등 세부 키워드를 검색하여 알레르기 성분을 놓치지 않도록 로직 강화.

### 3.3. APK 생성 및 배포 준비

- **플랫폼:** Android (Capacitor 사용)
- **네트워크 설정:**
  - 스마트폰과 PC 간 통신을 위해 `localhost` 주소를 개발 PC IP (`192.168.219.74`)로 전면 교체.
  - 대상 파일: `db.js`, `AuthModal.jsx`, `ProductDetailMain.jsx`, `vite.config.js` 등.
- **Android Manifest 설정 (`AndroidManifest.xml`):**
  - `android:usesCleartextTraffic="true"`: HTTP 통신 허용 (개발 서버 접속용).
  - `<uses-permission android:name="android.permission.CAMERA" />`: 바코드 스캐너 사용 권한 추가.
  - `<uses-permission android:name="android.permission.INTERNET" />`: 기본 네트워크 권한.

## 4. APK 빌드 및 실행 가이드

### 4.1. 필수 조건

- PC와 스마트폰이 **동일한 Wi-Fi 네트워크**에 연결되어 있어야 합니다.
- PC의 IP 주소는 `192.168.219.74`여야 합니다. (IP 변경 시 코드 내 IP도 수정 필요)

### 4.2. 빌드 방법 (Android Studio)

1. Android Studio 실행 -> **Open** 클릭.
2. 경로: `project/frontend/android` 폴더를 선택하여 엽니다. (주의: `frontend` 폴더가 아님)
3. **Gradle Sync** 완료 대기.
4. 상단 메뉴 **Build > Build Bundle(s) / APK(s) > Build APK(s)** 클릭.
5. 생성된 `app-debug.apk` 파일을 스마트폰으로 전송 및 설치.

## 5. 남은 과제 / 유지보수

- **Java(JDK) 설치:** 현재 PC 환경에서 터미널 커맨드(`npx cap run android`)로 바로 실행하려면 JDK 설치가 필요함.
- **실서버 배포:** 향후 로컬 PC가 아닌 클라우드(AWS 등) 배포 시 다시 IP 주소를 도메인으로 변경해야 함.
