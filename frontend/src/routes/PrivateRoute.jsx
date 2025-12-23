// src/routes/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

/**
 * 관리자 전용 보호 라우트
 * @param {object} user - 현재 로그인한 유저 정보
 * @param {JSX.Element} element - 접근하려는 컴포넌트
 */
const PrivateRoute = ({ user, element }) => {
  if (!user) {
    alert("로그인이 필요합니다.");
    return <Navigate to="/" />;
  }

  if (user.role !== "admin" && user.role !== "super_admin") {
    alert("관리자 권한이 없습니다.");
    return <Navigate to="/" />;
  }

  return element;
};

export default PrivateRoute;
