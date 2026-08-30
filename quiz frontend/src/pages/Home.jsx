// pages/Home.jsx — role-based landing: sends admin/user to the right dashboard
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  return <Navigate to={user.role === "ADMIN" ? "/admin" : "/play"} replace />;
}
