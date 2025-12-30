# 바코드 스캔 라이브러리 가이드 (html5-qrcode)

현재 프로젝트에서 사용 중인 웹/앱 겸용 바코드 스캔 라이브러리 정리입니다.

## 1. 개요

- **라이브러리명**: `html5-qrcode`
- **용도**: 웹 브라우저 및 하이브리드 앱(Capacitor)에서 카메라를 이용해 QR/바코드 읽기
- **특징**: 별도의 Native 플러그인 없이 자바스크립트만으로 동작하여 구현이 간편함.

## 2. 주요 클래스 (두 가지 방식)

### A. `Html5QrcodeScanner` (초급자용 / 현재 사용 중)

- **특징**: UI(화면)가 이미 다 만들어져 있습니다.
- **장점**: 코드 몇 줄로 바로 쓸 수 있음.
- **단점**:
  - 디자인 커스텀이 어렵습니다.
  - **"Start Scanning" 버튼을 사용자가 직접 눌러야 카메라가 켜집니다.** (바로 실행 불가)
  - '파일 업로드' 버튼 등이 강제로 표시됨.

### B. `Html5Qrcode` Pro (전문가용 / 교체 권장)

- **특징**: 껍데기 없이 **기능(Function)** 만 제공합니다.
- **장점**:
  - **버튼 없이 자동으로 카메라를 켤 수 있습니다.**
  - 원하는 위치에, 원하는 디자인으로 카메라 화면을 넣을 수 있습니다.
  - 후면/전면 카메라를 코드로 콕 집어서 제어할 수 있습니다.
- **사용법 예시**:

  ```javascript
  const scanner = new Html5Qrcode("reader-box-id");

  // 즉시 실행 명령
  scanner.start(
    { facingMode: "environment" }, // 후면 카메라 강제
    { fps: 10, qrbox: 250 },
    (text) => {
      console.log("성공:", text);
    },
    (err) => {
      /* 에러 무시 */
    }
  );
  ```

## 3. 추천 설정 (Best Practice)

안드로이드 앱의 매끄러운 사용자 경험을 위해 **B 방식(`Html5Qrcode`)으로 교체**하는 것을 강력 추천합니다.

- **현재 문제**: 사용자가 "스캔" 버튼을 누르고 -> 또 화면 안의 "카메라 켜기" 버튼을 눌러야 함.
- **개선 후**: "스캔" 버튼 누르면 -> **즉시 카메라가 켜짐.**

## 4. 안드로이드 권한 (필수)

이 라이브러리가 작동하려면 `AndroidManifest.xml`에 아래 권한이 꼭 있어야 합니다.

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />
```

_(현재 프로젝트에는 이미 적용되어 있습니다.)_
