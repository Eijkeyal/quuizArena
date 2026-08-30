import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();

  // User is not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User does not have the required role
  if (role && user.role !== role) {
    if (user.role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/user" replace />;
  }

  return children;
}