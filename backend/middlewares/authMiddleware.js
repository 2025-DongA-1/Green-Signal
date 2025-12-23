import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "토큰이 없습니다." });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "토큰이 유효하지 않습니다." });
    req.user = decoded;
    next();
  });
};

export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "super_admin")
    return res.status(403).json({ message: "관리자 전용 접근입니다." });
  next();
};
