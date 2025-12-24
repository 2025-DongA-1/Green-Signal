import React from 'react';

const ProfilePlaceholder = () => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>마이 프로필</h2>
        <p>사용자 정보 및 건강 설정 페이지 준비 중...</p>
    </div>
);

const SourcePlaceholder = () => (
    <div style={{ padding: '20px' }}>
        <h2>데이터 출처 및 라이선스</h2>
        <div className="card">
            <p><b>식품의약품안전처</b>: 공공데이터포털 제품 정보 시스템</p>
            <p><b>HACCP</b>: 공공데이터포털 식품안전정보</p>
            <p>본 앱에서 제공하는 정보는 실제 제품 포장지의 내용과 다를 수 있으므로, 알레르기 등 민감한 정보는 반드시 실제 제품을 확인하시기 바랍니다.</p>
        </div>
    </div>
);

export { ProfilePlaceholder, SourcePlaceholder };
