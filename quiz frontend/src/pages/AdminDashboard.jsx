import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../api";

export default function AdminDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function loadQuizzes() {
    try {
      setLoading(true);
      setError("");

      const data = await api.getQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load quizzes",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateQuiz(e) {
    e.preventDefault();

    try {
      setError("");

      const quiz = await api.createQuiz({
        title: title.trim(),
        description: description.trim(),
      });

      setTitle("");
      setDescription("");

      navigate(`/admin/quiz/${quiz._id}`);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create quiz",
      );
    }
  }

  const draftCount = quizzes.filter(
    (quiz) => quiz.status === "DRAFT",
  ).length;

  const readyCount = quizzes.filter(
    (quiz) => quiz.status === "READY",
  ).length;

  const liveCount = quizzes.filter(
    (quiz) => quiz.status === "LIVE",
  ).length;

  const completedCount = quizzes.filter(
    (quiz) => quiz.status === "COMPLETED",
  ).length;

  if (loading) {
    return (
      <div className="page">
        <div className="dashboard-loading">
          <p className="dim">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page admin-dashboard">
      <div className="dashboard-header">
        <div>
          <div className="eyebrow">ADMIN DASHBOARD</div>
          <h1>Quiz Management</h1>
          <p className="dim">
            Create, manage, and monitor all your quizzes from one place.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={loadQuizzes}
        >
          Refresh
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Quizzes</span>
          <strong className="stat-number">{quizzes.length}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Draft</span>
          <strong className="stat-number">{draftCount}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Ready</span>
          <strong className="stat-number">{readyCount}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Live</span>
          <strong className="stat-number">{liveCount}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <strong className="stat-number">{completedCount}</strong>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <div className="eyebrow">CREATE</div>
            <h2>Create New Quiz</h2>
          </div>
        </div>

        <form
          onSubmit={handleCreateQuiz}
          className="card create-quiz-card"
        >
          <div className="create-form-grid">
            <label>
              Quiz Title
              <input
                type="text"
                placeholder="Enter quiz title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>

            <label>
              Description
              <input
                type="text"
                placeholder="Enter a short description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>

          <div className="create-form-footer">
            <p className="dim">
              You can add questions after creating the quiz.
            </p>

            <button
              type="submit"
              className="btn btn-primary"
            >
              + Create Quiz
            </button>
          </div>
        </form>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <div className="eyebrow">MANAGEMENT</div>
            <h2>Your Quizzes</h2>
          </div>

          <span className="dim">
            {quizzes.length} quiz
            {quizzes.length !== 1 ? "zes" : ""}
          </span>
        </div>

        {quizzes.length === 0 ? (
          <div className="card empty-dashboard">
            <h3>No quizzes yet</h3>
            <p className="dim">
              Create your first quiz to start adding questions and
              hosting a quiz session.
            </p>
          </div>
        ) : (
          <div className="quiz-grid">
            {quizzes.map((quiz) => (
              <div className="card quiz-card" key={quiz._id}>
                <div className="quiz-card-top">
                  <span
                    className={`badge status-${quiz.status?.toLowerCase()}`}
                  >
                    {quiz.status}
                  </span>
                </div>

                <div className="quiz-card-content">
                  <h2>{quiz.title}</h2>

                  <p className="dim quiz-description">
                    {quiz.description || "No description provided."}
                  </p>
                </div>

                <div className="quiz-card-footer">
                  <span className="dim">
                    {quiz.createdAt
                      ? new Date(quiz.createdAt).toLocaleDateString()
                      : ""}
                  </span>

                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      navigate(`/admin/quiz/${quiz._id}`)
                    }
                  >
                    Manage →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}