import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ==================== AUTH ====================

export const register = (data) =>
  api.post("/auth/register", data).then((response) => response.data);

export const login = (data) =>
  api.post("/auth/login", data).then((response) => response.data);

// ==================== QUIZZES ====================

// GET all quizzes
export const getQuizzes = () =>
  api.get("/quizzes").then((response) => response.data);

// Alias
export const listQuizzes = getQuizzes;

// GET quiz by ID
export const getQuizById = (quizId) =>
  api.get(`/quizzes/${quizId}`).then((response) => response.data);

// Alias
export const getQuiz = getQuizById;

// CREATE quiz
export const createQuiz = (data) =>
  api.post("/quizzes", data).then((response) => response.data);

// UPDATE quiz
export const updateQuiz = (quizId, data) =>
  api.put(`/quizzes/${quizId}`, data).then((response) => response.data);

// DELETE quiz
export const deleteQuiz = (quizId) =>
  api.delete(`/quizzes/${quizId}`).then((response) => response.data);

// Mark quiz READY
export const readyQuiz = (quizId) =>
  api.patch(`/quizzes/${quizId}/ready`).then((response) => response.data);

// Alias
export const markReady = readyQuiz;

// START quiz
export const startQuiz = (quizId) =>
  api.post(`/quizzes/${quizId}/start`).then((response) => response.data);

// RESTART quiz
export const restartQuiz = (quizId) =>
  api.post(`/quizzes/${quizId}/restart`).then((response) => response.data);

// ==================== QUESTIONS ====================

// CREATE question
export const createQuestion = (quizId, data) =>
  api
    .post(`/quizzes/${quizId}/questions`, data)
    .then((response) => response.data);

// Alias
export const addQuestion = createQuestion;

// GET all questions for a quiz
export const getQuestionsByQuiz = (quizId) =>
  api.get(`/quizzes/${quizId}/questions`).then((response) => response.data);

// GET one question
export const getQuestionById = (questionId) =>
  api.get(`/questions/${questionId}`).then((response) => response.data);

// UPDATE question
export const updateQuestion = (questionId, data) =>
  api.put(`/questions/${questionId}`, data).then((response) => response.data);

// DELETE question
export const deleteQuestion = (questionId) =>
  api.delete(`/questions/${questionId}`).then((response) => response.data);

// ==================== QUIZ PARTICIPANTS ====================

// USER joins quiz
export const joinQuiz = (quizId) =>
  api.post(`/quizzes/${quizId}/join`).then((response) => response.data);

// ==================== ANSWERS ====================

// Submit answer
export const submitAnswer = (quizId, questionId, selectedAnswer) =>
  api
    .post(`/quizzes/${quizId}/questions/${questionId}/answer`, {
      selectedAnswer,
    })
    .then((response) => response.data);

// ==================== LEADERBOARD ====================

export const getLeaderboard = (quizId) =>
  api.get(`/quizzes/${quizId}/leaderboard`).then((response) => response.data);

// ==================== FINAL RESULT ====================

export const getQuizResult = (quizId) =>
  api.get(`/quizzes/${quizId}/result`).then((response) => response.data);

// ==================== USERS ====================

// GET all users
export const getUsers = () =>
  api.get("/users").then((response) => response.data);

// GET one user
export const getUser = (userId) =>
  api.get(`/users/${userId}`).then((response) => response.data);

// UPDATE user account
export const updateUser = (userId, data) =>
  api.put(`/users/${userId}`, data).then((response) => response.data);

// DELETE user account
export const deleteUser = (userId) =>
  api.delete(`/users/${userId}`).then((response) => response.data);

export default api;
