import passport from "passport";
import { Strategy as KakaoStrategy } from "passport-kakao";
import jwt from "jsonwebtoken";
import db from "../db.js";

passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: process.env.KAKAO_REDIRECT_URI,
    },
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
          // 기존 유저: 리프레시 토큰 갱신
          const refreshToken = jwt.sign({}, process.env.JWT_SECRET || "temp_secret", { expiresIn: "7d" });
          await db.query("UPDATE users SET refresh_token = ? WHERE user_id = ?", [refreshToken, user[0].user_id]);
          return done(null, { ...user[0], refresh_token: refreshToken });
        }

        // 리프레시 토큰 생성
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
