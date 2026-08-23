import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as api from "../api";
import Leaderboard from "../components/Leaderboard";

const initialForm = {
  question: "",
  opt0: "",
  opt1: "",
  opt2: "",
  opt3: "",
  correctAnswer: "",
  timeLimit: 10,
};

export default function AdminQuizManage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);

  // ==============================
  // LEADERBOARD
  // ==============================

  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] =
    useState(false);

  // ==============================
  // FORMS
  // ==============================

  const [form, setForm] = useState(initialForm);

  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");

  const [editingQuiz, setEditingQuiz] = useState(false);
  const [editingQuestionId, setEditingQuestionId] =
    useState(null);

  // ==============================
  // LOADING STATES
  // ==============================

  const [loading, setLoading] = useState(true);
  const [addingQuestion, setAddingQuestion] =
    useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [deletingQuiz, setDeletingQuiz] =
    useState(false);

  const [error, setError] = useState("");

  // ==============================
  // LOAD QUIZ + QUESTIONS
  // ==============================

  useEffect(() => {
    loadQuizData();
  }, [id]);

  async function loadQuizData() {
    try {
      setLoading(true);
      setError("");

      const [quizData, questionsData] =
        await Promise.all([
          api.getQuiz(id),
          api.getQuestionsByQuiz(id),
        ]);

      const loadedQuiz = quizData.quiz || quizData;

      const loadedQuestions = Array.isArray(questionsData)
        ? questionsData
        : questionsData.questions || [];

      setQuiz(loadedQuiz);

      setQuizTitle(loadedQuiz.title || "");
      setQuizDescription(
        loadedQuiz.description || "",
      );

      setQuestions(loadedQuestions);

      if (
        loadedQuiz.status === "LIVE" ||
        loadedQuiz.status === "COMPLETED"
      ) {
        await loadLeaderboard();
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      console.error("Failed to load quiz:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load quiz",
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // RELOAD QUESTIONS
  // ==============================

  async function loadQuestions() {
    const questionsData =
      await api.getQuestionsByQuiz(id);

    const loadedQuestions = Array.isArray(
      questionsData,
    )
      ? questionsData
      : questionsData.questions || [];

    setQuestions(loadedQuestions);

    return loadedQuestions;
  }

  // ==============================
  // LOAD LEADERBOARD
  // ==============================

  async function loadLeaderboard() {
    try {
      setLeaderboardLoading(true);

      const data = await api.getLeaderboard(id);

      const loadedLeaderboard = Array.isArray(data)
        ? data
        : data.leaderboard || [];

      setLeaderboard(loadedLeaderboard);
    } catch (err) {
      console.error(
        "Failed to load leaderboard:",
        err,
      );
    } finally {
      setLeaderboardLoading(false);
    }
  }

  // ==============================
  // LIVE AUTO REFRESH
  // ==============================

  useEffect(() => {
    if (quiz?.status !== "LIVE") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const quizData = await api.getQuiz(id);

        const updatedQuiz =
          quizData.quiz || quizData;

        setQuiz(updatedQuiz);

        await loadLeaderboard();
      } catch (err) {
        console.error(
          "Failed to refresh live quiz:",
          err,
        );
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [quiz?.status, id]);

  // ==============================
  // QUESTION FORM
  // ==============================

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => {
      const updatedForm = {
        ...prev,
        [name]: value,
      };

      // If an option is changed and that option was
      // previously selected as the correct answer,
      // update the correct answer too.
      if (
        name === "opt0" ||
        name === "opt1" ||
        name === "opt2" ||
        name === "opt3"
      ) {
        const oldValue = prev[name];

        if (prev.correctAnswer === oldValue) {
          updatedForm.correctAnswer = value;
        }
      }

      return updatedForm;
    });
  }

  // ==============================
  // ADD QUESTION
  // ==============================

  async function handleAddQuestion(e) {
    e.preventDefault();

    if (
      !form.question.trim() ||
      !form.opt0.trim() ||
      !form.opt1.trim() ||
      !form.opt2.trim() ||
      !form.opt3.trim()
    ) {
      setError(
        "Please fill in the question and all four options.",
      );
      return;
    }

    if (!form.correctAnswer.trim()) {
      setError("Please select the correct answer.");
      return;
    }

    try {
      setAddingQuestion(true);
      setError("");

      const newQuestion = {
        question: form.question.trim(),
        options: [
          form.opt0.trim(),
          form.opt1.trim(),
          form.opt2.trim(),
          form.opt3.trim(),
        ],
        correctAnswer: form.correctAnswer.trim(),
        timeLimit: Number(form.timeLimit),
        order: questions.length + 1,
      };

      await api.addQuestion(id, newQuestion);

      // Reload from database instead of manually
      // adding the API response to state.
      await loadQuestions();

      setForm(initialForm);
    } catch (err) {
      console.error(
        "Failed to add question:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to add question",
      );
    } finally {
      setAddingQuestion(false);
    }
  }

  // ==============================
  // EDIT QUESTION
  // ==============================

  function handleEditQuestion(question) {
    setEditingQuestionId(question._id);

    setForm({
      question: question.question || "",
      opt0: question.options?.[0] || "",
      opt1: question.options?.[1] || "",
      opt2: question.options?.[2] || "",
      opt3: question.options?.[3] || "",
      correctAnswer: question.correctAnswer || "",
      timeLimit: question.timeLimit || 10,
    });

    setError("");

    // Scroll to the question form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==============================
  // UPDATE QUESTION
  // ==============================

  async function handleUpdateQuestion(e) {
    e.preventDefault();

    if (
      !form.question.trim() ||
      !form.opt0.trim() ||
      !form.opt1.trim() ||
      !form.opt2.trim() ||
      !form.opt3.trim()
    ) {
      setError(
        "Please fill in the question and all four options.",
      );
      return;
    }

    if (!form.correctAnswer.trim()) {
      setError("Please select the correct answer.");
      return;
    }

    try {
      setAddingQuestion(true);
      setError("");

      const updatedQuestion = {
        question: form.question.trim(),
        options: [
          form.opt0.trim(),
          form.opt1.trim(),
          form.opt2.trim(),
          form.opt3.trim(),
        ],
        correctAnswer: form.correctAnswer.trim(),
        timeLimit: Number(form.timeLimit),
      };

      await api.updateQuestion(
        editingQuestionId,
        updatedQuestion,
      );

      // Reload questions from backend so React state
      // exactly matches MongoDB.
      await loadQuestions();

      setEditingQuestionId(null);
      setForm(initialForm);
    } catch (err) {
      console.error(
        "Failed to update question:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update question",
      );
    } finally {
      setAddingQuestion(false);
    }
  }

  // ==============================
  // DELETE QUESTION
  // ==============================

  async function handleDeleteQuestion(questionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question?",
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.deleteQuestion(questionId);

      // Reload questions from backend.
      await loadQuestions();

      if (editingQuestionId === questionId) {
        setEditingQuestionId(null);
        setForm(initialForm);
      }
    } catch (err) {
      console.error(
        "Failed to delete question:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete question",
      );
    }
  }

  // ==============================
  // UPDATE QUIZ
  // ==============================

  async function handleUpdateQuiz(e) {
    e.preventDefault();

    if (!quizTitle.trim()) {
      setError("Quiz title is required.");
      return;
    }

    try {
      setSavingQuiz(true);
      setError("");

      const data = await api.updateQuiz(id, {
        title: quizTitle.trim(),
        description: quizDescription.trim(),
      });

      const updatedQuiz = data.quiz || data;

      setQuiz(updatedQuiz);
      setQuizTitle(updatedQuiz.title || "");
      setQuizDescription(
        updatedQuiz.description || "",
      );

      setEditingQuiz(false);
    } catch (err) {
      console.error(
        "Failed to update quiz:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update quiz",
      );
    } finally {
      setSavingQuiz(false);
    }
  }

  // ==============================
  // DELETE QUIZ
  // ==============================

  async function handleDeleteQuiz() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this quiz and its questions?",
    );

    if (!confirmed) return;

    try {
      setDeletingQuiz(true);
      setError("");

      await api.deleteQuiz(id);

      navigate("/admin");
    } catch (err) {
      console.error(
        "Failed to delete quiz:",
        err,
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete quiz",
      );

      setDeletingQuiz(false);
    }
  }

  // ==============================
  // MARK READY
  // ==============================

  async function handleMarkReady() {
    try {
      setError("");

      const data = await api.markReady(id);

      setQuiz(data.quiz || data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to mark quiz ready",
      );
    }
  }

  // ==============================
  // START QUIZ
  // ==============================

  async function handleStartQuiz() {
    try {
      setError("");

      const data = await api.startQuiz(id);

      const updatedQuiz = data.quiz || data;

      setQuiz(updatedQuiz);

      await loadQuestions();
      await loadLeaderboard();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to start quiz",
      );
    }
  }

  // ==============================
  // RESTART QUIZ
  // ==============================

  async function handleRestartQuiz() {
    const confirmed = window.confirm(
      "Restart this quiz? Participant scores and previous answers will be cleared.",
    );

    if (!confirmed) return;

    try {
      setError("");

      const data = await api.restartQuiz(id);

      setQuiz(data.quiz || data);

      setLeaderboard([]);

      setEditingQuiz(false);
      setEditingQuestionId(null);
      setForm(initialForm);

      await loadQuizData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to restart quiz",
      );
    }
  }

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div className="page">
        <p className="dim">Loading quiz...</p>
      </div>
    );
  }

  // ==============================
  // NOT FOUND
  // ==============================

  if (!quiz) {
    return (
      <div className="page">
        <Link className="back" to="/admin">
          ← All quizzes
        </Link>

        <p className="error">
          {error || "Quiz not found"}
        </p>
      </div>
    );
  }

  // ==============================
  // PERMISSIONS BASED ON STATUS
  // ==============================

  // Questions can only be managed before the quiz starts
  // or after the previous session has completed.
  const canManageQuestions =
    quiz.status === "DRAFT" ||
    quiz.status === "COMPLETED";

  // Quiz details can also be edited in these states.
  const canEditQuiz =
    quiz.status === "DRAFT" ||
    quiz.status === "COMPLETED";

  // Quiz cannot be deleted while LIVE.
  const canDelete =
    quiz.status === "DRAFT" ||
    quiz.status === "READY" ||
    quiz.status === "COMPLETED";

  return (
    <div className="page">
      <Link className="back" to="/admin">
        ← Back to quizzes
      </Link>

      {/* ==========================
          QUIZ HEADER
      ========================== */}

      <div className="page-head">
        <div>
          <div className="eyebrow">
            Quiz management · {quiz.status}
          </div>

          {!editingQuiz ? (
            <>
              <h1>{quiz.title}</h1>

              {quiz.description && (
                <p className="dim">
                  {quiz.description}
                </p>
              )}
            </>
          ) : (
            <form
              className="stack"
              onSubmit={handleUpdateQuiz}
            >
              <input
                value={quizTitle}
                onChange={(e) =>
                  setQuizTitle(e.target.value)
                }
                placeholder="Quiz title"
                required
              />

              <input
                value={quizDescription}
                onChange={(e) =>
                  setQuizDescription(e.target.value)
                }
                placeholder="Quiz description"
              />

              <div className="row">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={savingQuiz}
                >
                  {savingQuiz
                    ? "Saving..."
                    : "Save changes"}
                </button>

                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    setEditingQuiz(false);
                    setQuizTitle(quiz.title || "");
                    setQuizDescription(
                      quiz.description || "",
                    );
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="row">
          {canEditQuiz && !editingQuiz && (
            <button
              className="btn btn-secondary"
              onClick={() => setEditingQuiz(true)}
            >
              Edit quiz
            </button>
          )}

          {quiz.status === "DRAFT" &&
            questions.length > 0 && (
              <button
                className="btn btn-primary"
                onClick={handleMarkReady}
              >
                Mark ready
              </button>
            )}

          {quiz.status === "READY" && (
            <button
              className="btn btn-primary"
              onClick={handleStartQuiz}
            >
              Start quiz
            </button>
          )}

          {quiz.status === "COMPLETED" && (
            <button
              className="btn btn-primary"
              onClick={handleRestartQuiz}
            >
              Restart quiz
            </button>
          )}

          {canDelete && (
            <button
              className="btn btn-ghost"
              onClick={handleDeleteQuiz}
              disabled={deletingQuiz}
            >
              {deletingQuiz
                ? "Deleting..."
                : "Delete quiz"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="error">{error}</p>
      )}

      {/* ==========================
          QUESTION MANAGEMENT
          DRAFT + COMPLETED
      ========================== */}

      {canManageQuestions && (
        <div className="split">
          {/* QUESTION FORM */}

          <form
            className="card stack"
            onSubmit={
              editingQuestionId
                ? handleUpdateQuestion
                : handleAddQuestion
            }
          >
            <div className="eyebrow">
              {editingQuestionId
                ? "Edit question"
                : quiz.status === "COMPLETED"
                  ? "Add question for next session"
                  : "Add question"}
            </div>

            {quiz.status === "COMPLETED" && (
              <p className="dim">
                You can update, delete, or add questions
                before restarting this quiz.
              </p>
            )}

            <label>
              Question
              <input
                type="text"
                name="question"
                value={form.question}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Option A
              <input
                type="text"
                name="opt0"
                value={form.opt0}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Option B
              <input
                type="text"
                name="opt1"
                value={form.opt1}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Option C
              <input
                type="text"
                name="opt2"
                value={form.opt2}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Option D
              <input
                type="text"
                name="opt3"
                value={form.opt3}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Correct Answer

              <select
                name="correctAnswer"
                value={form.correctAnswer}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select correct answer
                </option>

                <option value={form.opt0}>
                  A. {form.opt0 || "Option A"}
                </option>

                <option value={form.opt1}>
                  B. {form.opt1 || "Option B"}
                </option>

                <option value={form.opt2}>
                  C. {form.opt2 || "Option C"}
                </option>

                <option value={form.opt3}>
                  D. {form.opt3 || "Option D"}
                </option>
              </select>
            </label>

            <label>
              Time Limit (seconds)

              <input
                type="number"
                name="timeLimit"
                min="5"
                value={form.timeLimit}
                onChange={handleChange}
                required
              />
            </label>

            <div className="row">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={addingQuestion}
              >
                {addingQuestion
                  ? "Saving..."
                  : editingQuestionId
                    ? "Update question"
                    : "+ Add question"}
              </button>

              {editingQuestionId && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditingQuestionId(null);
                    setForm(initialForm);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* QUESTION LIST */}

          <div className="card">
            <div className="eyebrow">
              Questions · {questions.length}
            </div>

            {questions.length > 0 ? (
              <div className="q-list">
                {questions.map(
                  (question, index) => (
                    <div
                      className="quiz-card"
                      key={question._id}
                    >
                      <div className="quiz-card-top">
                        <strong>
                          {index + 1}.{" "}
                          {question.question}
                        </strong>

                        <span className="badge">
                          {question.timeLimit}s
                        </span>
                      </div>

                      <div className="dim">
                        {question.options?.map(
                          (option, optionIndex) => (
                            <div key={optionIndex}>
                              {String.fromCharCode(
                                65 + optionIndex,
                              )}
                              . {option}
                            </div>
                          ),
                        )}
                      </div>

                      <div className="row">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            handleEditQuestion(
                              question,
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() =>
                            handleDeleteQuestion(
                              question._id,
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="empty">
                No questions yet. Add your first
                question.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ==========================
          READY
      ========================== */}

      {quiz.status === "READY" && (
        <div className="card">
          <div className="eyebrow">
            Ready to start
          </div>

          <h2>Quiz is ready</h2>

          <p>
            {questions.length} questions have been
            loaded.
          </p>

          <p className="dim">
            Questions are locked while the quiz is ready
            to start.
          </p>
        </div>
      )}

      {/* ==========================
          LIVE
      ========================== */}

      {quiz.status === "LIVE" && (
        <>
          <div className="card live-card">
            <div className="live-head">
              <div>
                <div className="eyebrow">
                  Quiz is live
                </div>

                <h2>{quiz.title}</h2>
              </div>

              <div className="pulse-dot" />
            </div>

            <p>
              Current question:{" "}
              {(quiz.currentQuestionIndex ?? 0) + 1} of{" "}
              {questions.length}
            </p>

            <p className="dim">
              Quiz questions cannot be edited while the
              session is active.
            </p>
          </div>

          <div className="admin-leaderboard-section">
            <div className="leaderboard-section-head">
              <div>
                <div className="eyebrow">
                  Live monitoring
                </div>

                <h2>Current Rankings</h2>
              </div>

              <button
                className="btn btn-secondary"
                onClick={loadLeaderboard}
                disabled={leaderboardLoading}
              >
                {leaderboardLoading
                  ? "Refreshing..."
                  : "Refresh leaderboard"}
              </button>
            </div>

            <Leaderboard
              leaderboard={leaderboard}
              final={false}
            />
          </div>
        </>
      )}

      {/* ==========================
          COMPLETED
      ========================== */}

      {quiz.status === "COMPLETED" && (
        <>
          <div className="card">
            <div className="eyebrow">
              Previous session completed
            </div>

            <h2>Final Results</h2>

            <p>
              The previous quiz session has finished.
            </p>

            <p className="dim">
              You can edit the quiz and questions above
              for the next session. The final rankings
              from the completed session are shown below.
            </p>

            <button
              className="btn btn-primary"
              onClick={handleRestartQuiz}
            >
              Restart quiz
            </button>
          </div>

          <div className="admin-leaderboard-section">
            <div className="leaderboard-section-head">
              <div>
                <div className="eyebrow">
                  Final results
                </div>

                <h2>Final Rankings</h2>
              </div>

              <button
                className="btn btn-secondary"
                onClick={loadLeaderboard}
                disabled={leaderboardLoading}
              >
                {leaderboardLoading
                  ? "Refreshing..."
                  : "Refresh results"}
              </button>
            </div>

            <Leaderboard
              leaderboard={leaderboard}
              final={true}
            />
          </div>
        </>
      )}
    </div>
  );
}