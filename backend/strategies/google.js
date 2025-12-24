import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import db from "../db.js";


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const providerId = profile.id;
        const nickname = profile.displayName || "GoogleUser";

        const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

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
          ["google", providerId, email, nickname, "SOCIAL_LOGIN", refreshToken]
        );

        const newUser = { id: result.insertId, email, provider: "google", nickname, refresh_token: refreshToken };
        done(null, newUser);
      } catch (err) {
        console.error("Google Login Error:", err);
        done(err);
      }
    }
  )
);

export default passport;
