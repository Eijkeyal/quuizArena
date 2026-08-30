import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as api from "../api";
import Leaderboard from "../components/Leaderboard";

export default function UserQuizPlay() {
  const { id: quizId } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);

  const [quizResult, setQuizResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const [loading, setLoading] = useState(true);
  const [resultLoading, setResultLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const previousQuestionIndex = useRef(null);

  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        setError("");

        const quizData = await api.getQuizById(quizId);

        const questionsData =
          await api.getQuestionsByQuiz(quizId);

        setQuiz(quizData);

        setQuestions(
          Array.isArray(questionsData)
            ? questionsData
            : questionsData.questions || [],
        );

        previousQuestionIndex.current =
          quizData.currentQuestionIndex;
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Failed to load quiz",
        );
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const updatedQuiz =
          await api.getQuizById(quizId);

        if (
          updatedQuiz.status === "LIVE" &&
          previousQuestionIndex.current !==
            updatedQuiz.currentQuestionIndex
        ) {
          setSelectedAnswer(null);
          setAnswerResult(null);

          previousQuestionIndex.current =
            updatedQuiz.currentQuestionIndex;
        }

        setQuiz(updatedQuiz);
      } catch (err) {
        console.error(
          "Failed to refresh quiz:",
          err,
        );
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [quizId]);

  useEffect(() => {
    if (quiz?.status !== "COMPLETED") return;

    async function loadResults() {
      try {
        setResultLoading(true);
        setError("");

        const [resultData, leaderboardData] =
          await Promise.all([
            api.getQuizResult(quizId),
            api.getLeaderboard(quizId),
          ]);

        console.log("Quiz result:", resultData);
        console.log("Leaderboard:", leaderboardData);

        setQuizResult(resultData);

        setLeaderboard(
          Array.isArray(leaderboardData)
            ? leaderboardData
            : leaderboardData.leaderboard || [],
        );
      } catch (err) {
        console.error(
          "Failed to load quiz results:",
          err,
        );

        setError(
          err?.response?.data?.message ||
            "Failed to load quiz results",
        );
      } finally {
        setResultLoading(false);
      }
    }

    loadResults();
  }, [quiz?.status, quizId]);

  useEffect(() => {
    if (quiz?.status !== "LIVE") return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 500);

    return () => clearInterval(interval);
  }, [quiz?.status]);

  if (loading) {
    return (
      <div className="page">
        <p className="dim">Loading...</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="page">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="page">
        <p className="error">Quiz not found</p>
      </div>
    );
  }

  const currentQuestion =
    quiz.status === "LIVE"
      ? questions[quiz.currentQuestionIndex]
      : null;

  let remaining = 0;

  if (
    currentQuestion &&
    quiz.currentQuestionStartedAt
  ) {
    const startTime = new Date(
      quiz.currentQuestionStartedAt,
    ).getTime();

    const elapsedSeconds =
      (now - startTime) / 1000;

    remaining = Math.max(
      0,
      Math.ceil(
        currentQuestion.timeLimit - elapsedSeconds,
      ),
    );
  }

  async function onAnswer(answer) {
    if (
      selectedAnswer ||
      remaining <= 0 ||
      !currentQuestion
    ) {
      return;
    }

    try {
      setError("");
      setSelectedAnswer(answer);

      const result = await api.submitAnswer(
        quizId,
        currentQuestion._id,
        answer,
      );

      setAnswerResult(result);

      if (result.leaderboard) {
        setLeaderboard(result.leaderboard);
      }
    } catch (err) {
      setSelectedAnswer(null);

      setError(
        err?.response?.data?.message ||
          "Failed to submit answer",
      );
    }
  }

  return (
    <div className="page">
      <Link className="back" to="/user">
        ← Lobby
      </Link>

      <div className="eyebrow">
        {quiz.status}
      </div>

      <h1>{quiz.title}</h1>

      {error && (
        <p className="error">{error}</p>
      )}

      {quiz.status === "READY" && (
        <div className="card">
          <p>
            You're in! Waiting for the admin to start
            the quiz...
          </p>

          <div className="pulse-dot" />
        </div>
      )}

      {quiz.status === "LIVE" &&
        currentQuestion && (
          <div className="card live-card">
            <div className="live-head">
              <span className="eyebrow">
                Question{" "}
                {quiz.currentQuestionIndex + 1}
                {" / "}
                {questions.length}
              </span>

              <span className="timer">
                {remaining}s
              </span>
            </div>

            <h2>
              {currentQuestion.question}
            </h2>

            <div className="options">
              {currentQuestion.options.map(
                (option, index) => {
                  let className = "";

                  if (answerResult) {
                    if (
                      option === selectedAnswer &&
                      answerResult.isCorrect
                    ) {
                      className = "opt-correct";
                    } else if (
                      option === selectedAnswer &&
                      !answerResult.isCorrect
                    ) {
                      className = "opt-wrong";
                    }
                  }

                  return (
                    <button
                      key={index}
                      className={`opt-btn ${className}`}
                      disabled={
                        selectedAnswer !== null ||
                        remaining <= 0
                      }
                      onClick={() =>
                        onAnswer(option)
                      }
                    >
                      {String.fromCharCode(
                        65 + index,
                      )}
                      . {option}
                    </button>
                  );
                },
              )}
            </div>

            {answerResult ? (
              <p
                className={`feedback ${
                  answerResult.isCorrect
                    ? "ok"
                    : "no"
                }`}
              >
                {answerResult.isCorrect
                  ? `Correct! +${answerResult.pointsEarned} points`
                  : "Wrong answer — 0 points"}
              </p>
            ) : (
              <p className="dim">
                Pick an answer before time runs out.
              </p>
            )}
          </div>
        )}

      {quiz.status === "COMPLETED" && (
        <>
          <div className="card">
            <div className="eyebrow">
              Final Results
            </div>

            <h2>Quiz Complete!</h2>

            <p className="dim">
              The final results have been calculated.
            </p>

            {resultLoading && (
              <p className="dim">
                Loading your results...
              </p>
            )}

            {!resultLoading && quizResult && (
              <div className="result-stats">
                <p>
                  <strong>Correct Answers:</strong>{" "}
                  {quizResult.correctAnswers ?? 0}
                </p>

                <p>
                  <strong>Wrong Answers:</strong>{" "}
                  {quizResult.wrongAnswers ?? 0}
                </p>

                <p>
                  <strong>Total Points:</strong>{" "}
                  {quizResult.totalPoints ?? 0}
                </p>

                <p>
                  <strong>Your Rank:</strong>{" "}
                  #{quizResult.rank ?? "-"}
                </p>
              </div>
            )}
          </div>

          {leaderboard.length > 0 && (
            <div className="leaderboard">
              <div className="eyebrow">
                Final Leaderboard
              </div>

              <Leaderboard
                leaderboard={leaderboard}
              />
            </div>
          )}
        </>
      )}

      {quiz.status === "LIVE" &&
        !currentQuestion && (
          <div className="card">
            <p>
              Waiting for the next question...
            </p>
          </div>
        )}
    </div>
  );
}