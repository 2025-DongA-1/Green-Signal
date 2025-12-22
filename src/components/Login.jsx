import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // 실제 로그인은 추후 DB 연동
        console.log('Login attempt:', email);
        if (onLoginSuccess) onLoginSuccess();
        alert('로그인되었습니다!');
        navigate('/');
    };

    return (
        <div style={{ padding: '40px 20px', maxWidth: '400px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>로그인</h2>
            <form onSubmit={handleLogin} className="stack">
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>이메일</label>
                        <input
                            type="email"
                            className="input"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@email.com"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>비밀번호</label>
                        <input
                            type="password"
                            className="input"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            required
                        />
                    </div>
                    <button type="submit" className="btn" style={{ width: '100%' }}>로그인</button>
                </div>
            </form>
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                아직 회원이 아니신가요? <span style={{ color: 'var(--c-primary)', cursor: 'pointer' }}>회원가입</span>
            </div>
        </div>
    );
};

export default Login;
