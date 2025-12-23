import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "토큰 없음" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "토큰 없음" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded: { id, email, role, iat, exp }
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "유효하지 않은 토큰" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "인증 필요" });
  if (req.user.role === "admin" || req.user.role === "super_admin") return next();
  return res.status(403).json({ error: "관리자만 접근 가능" });
}

export function requireSuperAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "인증 필요" });
  if (req.user.role === "super_admin") return next();
  return res.status(403).json({ error: "super_admin만 접근 가능" });
}
