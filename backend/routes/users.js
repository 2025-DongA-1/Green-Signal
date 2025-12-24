// backend/routes/users.js
import express from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// ✅ JWT// 토큰 검증 미들웨어
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "토큰이 없습니다." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "temp_secret");
    
    // DB에서 사용자 확인 (user_id로 조회)
    // 페이로드에 id가 있을 수도 있고 user_id가 있을 수도 있음
    const userId = decoded.user_id || decoded.id; 
    const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [userId]);

    if (!user.length) {
      return res.status(401).json({ message: "유효하지 않은 사용자입니다." });
    }

    req.user = user[0];
    next();
  } catch (err) {
    console.error("토큰 검증 실패:", err);
    return res.status(401).json({ message: "토큰이 유효하지 않습니다." });
  }
};

// ✅ 내 정보 조회 (로그인 유지용)
router.get("/me", verifyToken, async (req, res) => {
  try {

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 모든 유저 조회 (관리자페이지용)
// (원하면 나중에 verifyToken + role 체크로 관리자만 막을 수 있음)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "유저 목록 불러오기 실패" });
  }
});

// ✅ 유저 정보 수정 (마이페이지/관리자 공용)
// nickname, allergy, user_type, traits, role, is_active 등 부분 업데이트
router.put("/:id", async (req, res) => {
  try {
    const { nickname, allergy, user_type, traits, role, is_active } = req.body;

    const fields = [];
    const values = [];

    if (nickname !== undefined) {
      fields.push("nickname=?");
      values.push(nickname);
    }
    if (allergy !== undefined) {
      fields.push("allergy=?");
      values.push(allergy);
    }
    if (user_type !== undefined) {
      fields.push("user_type=?");
      values.push(user_type);
    }
    if (traits !== undefined) {
      fields.push("traits=?");
      values.push(traits);
    }
    if (role !== undefined) {
      fields.push("role=?");
      values.push(role);
    }
    if (is_active !== undefined) {
      fields.push("is_active=?");
      values.push(is_active);
    }

    if (fields.length === 0) return res.json({ message: "변경할 내용 없음" });

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id=?`;
    values.push(req.params.id);

    await db.query(sql, values);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "유저 정보 수정 실패" });
  }
});

// ✅ 유저 삭제 (관리자페이지용)
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "유저 삭제 실패" });
  }
});

export default router;
