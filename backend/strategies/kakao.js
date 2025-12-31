import passport from "passport";
import { Strategy as KakaoStrategy } from "passport-kakao";
import jwt from "jsonwebtoken";
import db from "../db.js";

// clientSecret 미사용: 카카오 콘솔에서 비활성화한 경우도 있어서 아예 전달하지 않는다.
const kakaoOptions = {
  clientID: process.env.KAKAO_CLIENT_ID,
  callbackURL: process.env.KAKAO_REDIRECT_URI,
};

// clientSecret이 설정되어 있으면 함께 전달 (콘솔에서 사용으로 켠 경우)
if (process.env.KAKAO_CLIENT_SECRET) {
  kakaoOptions.clientSecret = process.env.KAKAO_CLIENT_SECRET;
}

// 디버그용: 실제 사용 중인 값 출력
console.log("[KAKAO] clientID:", process.env.KAKAO_CLIENT_ID);
console.log("[KAKAO] redirectURI:", process.env.KAKAO_REDIRECT_URI);
console.log("[KAKAO] clientSecret:", process.env.KAKAO_CLIENT_SECRET || "(empty)");

passport.use(
  new KakaoStrategy(
    kakaoOptions,
    async (accessToken, refreshToken, profile, done) => {
      try {
        const kakaoId = profile.id;
        const email =
          profile._json?.kakao_account?.email || `kakao_${kakaoId}@noemail.com`;
        const nickname =
          profile._json?.properties?.nickname || "KakaoUser";

        const [user] = await db.query(
          "SELECT * FROM users WHERE (provider = ? AND social_id = ?) OR email = ?",
          ["kakao", kakaoId, email]
        );
        if (user.length > 0) {
          // 기존 사용자: 리프레시 토큰 갱신
          const refreshToken = jwt.sign({}, process.env.JWT_SECRET || "temp_secret", { expiresIn: "7d" });
          await db.query("UPDATE users SET refresh_token = ? WHERE user_id = ?", [refreshToken, user[0].user_id]);
          return done(null, { ...user[0], refresh_token: refreshToken });
        }

        // 신규 사용자 생성
        const refreshToken = jwt.sign({}, process.env.JWT_SECRET || "temp_secret", { expiresIn: "7d" });

        const [result] = await db.query(
          `INSERT INTO users (provider, social_id, email, nickname, role, is_active, password, refresh_token)
            VALUES (?, ?, ?, ?, 'user', 1, ?, ?)`,
          ["kakao", kakaoId, email, nickname, "SOCIAL_LOGIN", refreshToken]
        );

        const newUser = { id: result.insertId, email, provider: "kakao", nickname, refresh_token: refreshToken };
        done(null, newUser);
      } catch (err) {
        console.error("Kakao Login Error:", err);
        done(err);
      }
    }
  )
);

export default passport;
