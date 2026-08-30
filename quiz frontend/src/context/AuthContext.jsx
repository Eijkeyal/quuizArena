import { createContext, useContext, useState } from "react";
import * as api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  function persist(data) {
    console.log("LOGIN RESPONSE:", data);

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));

    setUser(data.user);
  }

  async function login(email, password) {
    const data = await api.login({
      email,
      password,
    });

    console.log("TOKEN RECEIVED:", data.token);

    persist(data);

    return data.user;
  }

  async function register(name, email, password) {
    const data = await api.register({
      name,
      email,
      password,
    });

    persist(data);

    return data.user;
  }

  function logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);