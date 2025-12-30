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
import searchRouter from "./routes/search.js";
import recommendationRouter from './routes/recommendation.js';
import productRouter from "./routes/product.js";
import db from "./db.js";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: true, // 모든 출처 허용 (개발용)
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
app.use("/api/search", searchRouter);
app.use("/api/product", productRouter);
app.use("/api/recommend", recommendationRouter); // ✅ 추천 라우터 추가

// ✅ 프론트엔드 직접 SQL 실행 지원 (레거시 코드 호환용)
app.post("/api/execute", async (req, res) => {
  try {
    const { sql, params } = req.body;
    // console.log("Executing SQL:", sql, params); // 디버깅용 로그
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("SQL Exec Error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
