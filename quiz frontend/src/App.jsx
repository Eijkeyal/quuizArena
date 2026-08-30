import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Auth from "./pages/Auth";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import AdminQuizManage from "./pages/AdminQuizManage";
import UserDashboard from "./pages/UserDashboard";
import UserQuizPlay from "./pages/UserQuizPlay";
import UserPage from "./pages/UserPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/login" element={<Auth />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/quiz/:id"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminQuizManage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute role="ADMIN">
                <UserPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user"
            element={
              <ProtectedRoute role="USER">
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/play/:id"
            element={
              <ProtectedRoute role="USER">
                <UserQuizPlay />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}