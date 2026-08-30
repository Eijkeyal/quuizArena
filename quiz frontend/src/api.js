import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// JWT AUTHENTICATION
// ============================================================

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ============================================================
// AUTH
// ============================================================

export const register = (data) =>
  api.post("/auth/register", data).then((response) => response.data);

export const login = (data) =>
  api.post("/auth/login", data).then((response) => response.data);

// ============================================================
// QUIZZES
// ============================================================

export const getQuizzes = () =>
  api.get("/quizzes").then((response) => response.data);

export const listQuizzes = getQuizzes;

export const getQuizById = (quizId) =>
  api.get(`/quizzes/${quizId}`).then((response) => response.data);

export const getQuiz = getQuizById;

export const createQuiz = (data) =>
  api.post("/quizzes", data).then((response) => response.data);

export const updateQuiz = (quizId, data) =>
  api.put(`/quizzes/${quizId}`, data).then((response) => response.data);

export const deleteQuiz = (quizId) =>
  api.delete(`/quizzes/${quizId}`).then((response) => response.data);

export const readyQuiz = (quizId) =>
  api.patch(`/quizzes/${quizId}/ready`).then((response) => response.data);

export const markReady = readyQuiz;

export const startQuiz = (quizId) =>
  api.post(`/quizzes/${quizId}/start`).then((response) => response.data);

export const restartQuiz = (quizId) =>
  api.post(`/quizzes/${quizId}/restart`).then((response) => response.data);

// ============================================================
// QUESTIONS
// ============================================================

export const createQuestion = (quizId, data) =>
  api
    .post(`/quizzes/${quizId}/questions`, data)
    .then((response) => response.data);

export const addQuestion = createQuestion;

export const getQuestionsByQuiz = (quizId) =>
  api.get(`/quizzes/${quizId}/questions`).then((response) => response.data);

export const getQuestionById = (questionId) =>
  api.get(`/questions/${questionId}`).then((response) => response.data);

export const updateQuestion = (questionId, data) =>
  api.put(`/questions/${questionId}`, data).then((response) => response.data);

export const deleteQuestion = (questionId) =>
  api.delete(`/questions/${questionId}`).then((response) => response.data);

// ============================================================
// QUIZ PARTICIPANTS
// ============================================================

export const joinQuiz = (quizId) =>
  api.post(`/quizzes/${quizId}/join`).then((response) => response.data);

// ============================================================
// ANSWERS
// ============================================================

export const submitAnswer = (quizId, questionId, selectedAnswer) =>
  api
    .post(`/quizzes/${quizId}/questions/${questionId}/answer`, {
      selectedAnswer,
    })
    .then((response) => response.data);

// ============================================================
// LEADERBOARD
// ============================================================

export const getLeaderboard = (quizId) =>
  api.get(`/quizzes/${quizId}/leaderboard`).then((response) => response.data);

// ============================================================
// FINAL RESULT
// ============================================================

export const getQuizResult = (quizId) =>
  api.get(`/quizzes/${quizId}/result`).then((response) => response.data);

// ============================================================
// USERS
// ============================================================

// Get all users except logged-in user
export const getUsers = () =>
  api.get("/users").then((response) => response.data);

// Private chat uses the same endpoint
export const getChatUsers = getUsers;

// Get one user
export const getUser = (userId) =>
  api.get(`/users/${userId}`).then((response) => response.data);

// Update own account
export const updateUser = (userId, data) =>
  api.put(`/users/${userId}`, data).then((response) => response.data);

// Delete own account
export const deleteUser = (userId) =>
  api.delete(`/users/${userId}`).then((response) => response.data);

// ============================================================
// PRIVATE CONVERSATIONS
// ============================================================

// Create or get existing conversation
export const createConversation = (userId) =>
  api
    .post("/conversations", {
      userId,
    })
    .then((response) => response.data);

// Get current user's conversations
export const getConversations = () =>
  api.get("/conversations").then((response) => response.data);

// Get one conversation
export const getConversationById = (conversationId) =>
  api.get(`/conversations/${conversationId}`).then((response) => response.data);

// Delete conversation
export const deleteConversation = (conversationId) =>
  api
    .delete(`/conversations/${conversationId}`)
    .then((response) => response.data);

// ============================================================
// PRIVATE MESSAGES
// ============================================================

// Get messages
export const getMessages = (conversationId, page = 1, limit = 50) =>
  api
    .get(`/conversations/${conversationId}/messages`, {
      params: {
        page,
        limit,
      },
    })
    .then((response) => response.data);

// Create/send message
export const createMessage = (conversationId, content) =>
  api
    .post(`/conversations/${conversationId}/messages`, {
      content,
    })
    .then((response) => response.data);

// Alias
export const sendMessage = createMessage;

// Edit message
// Backend: PUT /messages/:id
export const updateMessage = (messageId, content) =>
  api
    .put(`/messages/${messageId}`, {
      content,
    })
    .then((response) => response.data);

// Delete message
// Backend: DELETE /messages/:id
export const deleteMessage = (messageId) =>
  api.delete(`/messages/${messageId}`).then((response) => response.data);

// ============================================================
// EXPORT AXIOS INSTANCE
// ============================================================

export default api;
