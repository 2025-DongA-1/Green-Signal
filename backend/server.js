import express from "express";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

import "./strategies/google.js";
import "./strategies/kakao.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONT_URI || "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use("/auth", authRouter);
app.use("/users", usersRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
