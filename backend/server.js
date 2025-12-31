import express from "express";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

import "./strategies/google.js";
import "./strategies/kakao.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import searchRouter from "./routes/search.js";
import recommendationRouter from "./routes/recommendation.js";
import productRouter from "./routes/product.js";
import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../frontend/dist");

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
app.use("/api/recommend", recommendationRouter); // 추천 라우트 추가

// 관리용 SQL 실행 엔드포인트 (보안 주의)
app.post("/api/execute", async (req, res) => {
  try {
    const { sql, params } = req.body;
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("SQL Exec Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Serve built frontend (single-port deployment for ngrok/free tier)
app.use(express.static(distPath));
app.get("*", (req, res, next) => {
  if (
    req.path.startsWith("/api") ||
    req.path.startsWith("/auth") ||
    req.path.startsWith("/users")
  ) {
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on http://0.0.0.0:${PORT}`)
);
