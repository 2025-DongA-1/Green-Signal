import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import db from "../db.js";

const router = express.Router();

// ✅ 회원가입
router.post("/register", async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "이메일과 비밀번호를 입력하세요." });

    const [exists] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (exists.length)
      return res.status(400).json({ message: "이미 존재하는 이메일입니다." });

    const [result] = await db.query(
      `INSERT INTO users (provider, email, password, nickname, role)
       VALUES ('local', ?, ?, ?, 'user')`,
      [email, password, nickname || "유저"]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role: "user" },
      process.env.JWT_SECRET || "temp_secret",
      { expiresIn: "1h" }
    );

    res.json({ message: "회원가입 완료", token });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 로그인
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (!user.length)
      return res.status(401).json({ message: "존재하지 않는 이메일입니다." });

    // 단순 문자열 비교 (bcrypt 제거)
    if (user[0].password !== password)
      return res.status(401).json({ message: "비밀번호가 올바르지 않습니다." });

    const token = jwt.sign(
      { id: user[0].id, email: user[0].email, role: user[0].role },
      process.env.JWT_SECRET || "temp_secret",
      { expiresIn: "1h" }
    );

    res.json({ message: "로그인 성공", token });
  } catch (err) {
    console.error("로그인 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 비밀번호 찾기
router.post("/forgot", async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) return res.status(400).json({ message: "이메일을 입력하세요." });

    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!user.length)
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    const tempPw = Math.random().toString(36).slice(-8);

    // ✅ 네이버 SMTP (앱 비밀번호 사용)
    const transporter = nodemailer.createTransport({
      host: "smtp.naver.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER, // 예: hoony6837@naver.com
        pass: process.env.MAIL_PASS, // 네이버 애플리케이션 비밀번호(12자리)
      },
    });

    // (선택) 설정/인증 확인용 - 문제 생기면 여기서 바로 에러남
    await transporter.verify();

    // ✅ 메일 먼저 보내고(성공하면) 비번 업데이트 (실패했는데 비번만 바뀌는 사고 방지)
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "임시 비밀번호 안내",
      text: `임시 비밀번호는 ${tempPw} 입니다. 로그인 후 비밀번호를 변경하세요.`,
    });

    await db.query("UPDATE users SET password=? WHERE email=?", [tempPw, email]);

    res.json({ message: "임시 비밀번호가 이메일로 전송되었습니다." });
  } catch (err) {
    console.error("비밀번호 찾기 오류:", err);
    res.status(500).json({ message: "메일 전송 실패", error: err.message });
  }
});

// ✅ 구글 로그인
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: "user", provider: "google" },
      process.env.JWT_SECRET || "temp_secret",
      { expiresIn: "1h" }
    );
    res.redirect(`${process.env.FRONT_URI}/?token=${token}`);
  }
);

// ✅ 카카오 로그인
router.get("/kakao", passport.authenticate("kakao"));
router.get(
  "/kakao/callback",
  passport.authenticate("kakao", { failureRedirect: "/" }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: "user", provider: "kakao" },
      process.env.JWT_SECRET || "temp_secret",
      { expiresIn: "1h" }
    );
    res.redirect(`${process.env.FRONT_URI}/?token=${token}`);
  }
);

export default router;
