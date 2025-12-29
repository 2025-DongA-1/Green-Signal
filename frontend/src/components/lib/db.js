/**
 * [가상 데이터베이스 서비스 -> MySQL API 연동 버전]
 * 이제 로컬 브라우저의 가상 DB가 아닌, 
 * Node.js 서버를 통해 실제 MySQL 데이터베이스에 접근합니다.
 */
class RemoteDatabase {
    constructor() {
        this.apiUrl = 'http://192.168.219.74:3000/api/execute';
    }

    /**
     * [SQL 실행]
     * Node.js 백엔드 서버에 SQL 쿼리를 요청합니다.
     */
    async execute(sql, params = []) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql, params }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("DB Execute failed:", response.status, errorText);
                throw new Error(errorText || 'Server Error');
            }

            const result = await response.json();
            // console.log("DB Execute Success:", sql, result); // DEBUG
            return result;
        } catch (error) {
            console.error('Database Request Failed:', error);
            // alert("데이터베이스 연결 실패: " + error.message); // 임시 알림으로 켜보면 확인 가능
            throw error;
        }
    }

    // MySQL은 서버에서 영구 저장되므로 별도의 persist 로직은 필요 없습니다.
    persist() {
        console.log('Data is managed by MySQL server.');
    }
}

const db = new RemoteDatabase();
export default db;
