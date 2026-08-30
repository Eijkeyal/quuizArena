import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <header className="nav">
      <div className="nav-brand">
        QUIZ<span>ARENA</span>
      </div>

      <div className="nav-right">
        <span className="nav-user">
          {user.name}{" "}
          <span className="nav-role">
            {user.role}
          </span>
        </span>

        <button
          className="btn btn-ghost"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Log out
        </button>
      </div>
    </header>
  );
}