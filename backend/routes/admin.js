import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../db.js";

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "토큰 없음" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "토큰 오류" });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(401).json({ error: "유저 없음" });

    const role = rows[0].role;
    if (role !== "admin" && role !== "super_admin") {
      return res.status(403).json({ error: "관리자 권한이 필요합니다." });
    }
    req.adminRole = role;
    return next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    return res.status(500).json({ error: "서버 오류" });
  }
};

// ✅ 유저 목록 (검색/페이지)
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(5, Number(req.query.limit || 20)));
  const offset = (page - 1) * limit;
  const search = String(req.query.search || "").trim();

  try {
    let where = "";
    let params = [];
    if (search) {
      where = "WHERE email LIKE ? OR nickname LIKE ?";
      params = [`%${search}%`, `%${search}%`];
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as cnt FROM users ${where}`,
      params
    );
    const total = countRows[0].cnt;

    const [rows] = await pool.query(
      `SELECT id, provider, provider_id, email, nickname, allergy, user_type, role, is_active, created_at, updated_at
       FROM users
       ${where}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({ page, limit, total, users: rows });
  } catch (err) {
    console.error("admin users error:", err);
    return res.status(500).json({ error: "유저 목록 조회 실패" });
  }
});

// ✅ role 변경
router.patch("/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
  const targetId = Number(req.params.id);
  const { role } = req.body || {};
  const allowed = ["user", "admin", "super_admin"];

  if (!allowed.includes(role)) return res.status(400).json({ error: "role 값이 올바르지 않습니다." });

  try {
    // super_admin은 super_admin만 변경 가능
    if (role === "super_admin" && req.adminRole !== "super_admin") {
      return res.status(403).json({ error: "super_admin 지정은 super_admin만 가능합니다." });
    }

    // 대상 유저가 super_admin이면 admin은 건드릴 수 없음
    const [targetRows] = await pool.query("SELECT role FROM users WHERE id = ?", [targetId]);
    if (targetRows.length === 0) return res.status(404).json({ error: "대상 유저 없음" });

    if (targetRows[0].role === "super_admin" && req.adminRole !== "super_admin") {
      return res.status(403).json({ error: "super_admin 계정은 변경할 수 없습니다." });
    }

    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, targetId]);
    return res.json({ success: true });
  } catch (err) {
    console.error("role update error:", err);
    return res.status(500).json({ error: "role 변경 실패" });
  }
});

// ✅ 유저 삭제
router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const targetId = Number(req.params.id);

  try {
    const [targetRows] = await pool.query("SELECT role FROM users WHERE id = ?", [targetId]);
    if (targetRows.length === 0) return res.status(404).json({ error: "대상 유저 없음" });

    // super_admin은 super_admin만 삭제 가능
    if (targetRows[0].role === "super_admin" && req.adminRole !== "super_admin") {
      return res.status(403).json({ error: "super_admin 계정은 삭제할 수 없습니다." });
    }

    await pool.query("DELETE FROM users WHERE id = ?", [targetId]);
    return res.json({ success: true });
  } catch (err) {
    console.error("delete user error:", err);
    return res.status(500).json({ error: "유저 삭제 실패" });
  }
});

export default router;
