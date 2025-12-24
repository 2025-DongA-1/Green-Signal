import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ isLoggedIn, loading, children, requireAdmin = false, role }) => {
  if (loading) return <div className="p-6 text-gray-600">로딩 중...</div>;

  if (!isLoggedIn) return <Navigate to="/" replace />;

  if (requireAdmin && role !== "admin") return <Navigate to="/" replace />;

  return children;
};

export default PrivateRoute;
