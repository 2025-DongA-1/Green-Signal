import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
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

        if (user.length > 0) return done(null, user[0]);

        const [result] = await db.query(
          `INSERT INTO users (provider, provider_id, email, nickname, role, is_active)
           VALUES (?, ?, ?, ?, 'user', 1)`,
          ["google", providerId, email, nickname]
        );

        const newUser = { id: result.insertId, email, provider: "google", nickname };
        done(null, newUser);
      } catch (err) {
        console.error("Google Login Error:", err);
        done(err);
      }
    }
  )
);

export default passport;
