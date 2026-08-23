import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => {
    setForm((previous) => ({
      ...previous,
      [key]: e.target.value,
    }));
  };

  async function onSubmit(e) {
    e.preventDefault();

    setError("");

    try {
      let loggedInUser;

      if (mode === "login") {
        loggedInUser = await login(form.email, form.password);
      } else {
        loggedInUser = await register(
          form.name,
          form.email,
          form.password,
        );
      }

      // Redirect based on backend user role
      if (loggedInUser.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="eyebrow">
          {mode === "login" ? "Sign in" : "Create account"}
        </div>

        <h1>
          {mode === "login" ? "Welcome back" : "Join the arena"}
        </h1>

        <form className="stack" onSubmit={onSubmit}>
          {mode === "register" && (
            <label>
              Name
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                required
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              required
              minLength="8"
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="btn btn-primary" type="submit">
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="switch">
          {mode === "login" ? (
            <>
              No account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode("register");
                  setError("");
                }}
              >
                Register
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode("login");
                  setError("");
                }}
              >
                Log in
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}