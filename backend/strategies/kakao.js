import passport from "passport";
import { Strategy as KakaoStrategy } from "passport-kakao";
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

        const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (user.length > 0) return done(null, user[0]);

        const [result] = await db.query(
          `INSERT INTO users (provider, social_id, email, nickname, role, is_active)
            VALUES (?, ?, ?, ?, 'user', 1)`,
          ["kakao", kakaoId, email, nickname]
        );

        const newUser = { id: result.insertId, email, provider: "kakao", nickname };
        done(null, newUser);
      } catch (err) {
        console.error("Kakao Login Error:", err);
        done(err);
      }
    }
  )
);

export default passport;
