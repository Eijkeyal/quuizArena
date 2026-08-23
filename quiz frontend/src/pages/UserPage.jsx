import { useEffect, useState } from "react";
import api from "../api";

export default function UserPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await api.get("/users");
        setUsers(response.data);
      } catch (err) {
        setError(
          err?.response?.data?.message || "Failed to load users"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <p className="dim">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="eyebrow">Admin</div>
      <h1>All Users</h1>

      {error && <p className="error">{error}</p>}

      {!error && users.length === 0 && (
        <p className="empty">No users found.</p>
      )}

      {!error && users.length > 0 && (
        <div className="card">
          <p className="dim">
            Total users: {users.length}
          </p>

          <div className="user-list">
            {users.map((user) => (
              <div className="user-row" key={user._id}>
                <div>
                  <h3>{user.name}</h3>
                  <p className="dim">{user.email}</p>
                </div>

                <span className="badge">
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}