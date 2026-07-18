import { Navigate, Outlet } from "react-router";
import { getToken } from "@/utils/auth";

const ProtectedRoute = () => {
  const isAuthenticated = !!getToken();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
