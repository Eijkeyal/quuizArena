import { verifyToken } from "../utils/jwt.js";

const initSocket = (io) => {
  // ============================================================
  // SOCKET AUTHENTICATION
  // ============================================================
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error: No token"));
    }

    try {
      const decoded = verifyToken(token);

      socket.userId = decoded.userId;
      socket.role = decoded.role;

      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // ============================================================
  // CONNECTION
  // ============================================================
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (user ${socket.userId})`);

    // ==========================================================
    // PRIVATE CHAT
    // ==========================================================

    // Join private conversation
    socket.on("joinConversation", (conversationId) => {
      if (!conversationId) {
        return;
      }

      const room = `conversation:${conversationId}`;

      socket.join(room);

      console.log(`User ${socket.userId} joined ${room}`);
    });

    // Leave private conversation
    socket.on("leaveConversation", (conversationId) => {
      if (!conversationId) {
        return;
      }

      const room = `conversation:${conversationId}`;

      socket.leave(room);

      console.log(`User ${socket.userId} left ${room}`);
    });

    // ==========================================================
    // QUIZ CHAT
    // ==========================================================

    // Join quiz lobby
    socket.on("joinQuiz", (quizId) => {
      if (!quizId) {
        return;
      }

      const room = `quiz:${quizId}`;

      socket.join(room);

      console.log(`User ${socket.userId} joined ${room}`);
    });

    // Leave quiz lobby
    socket.on("leaveQuiz", (quizId) => {
      if (!quizId) {
        return;
      }

      const room = `quiz:${quizId}`;

      socket.leave(room);

      console.log(`User ${socket.userId} left ${room}`);
    });

    // ==========================================================
    // DISCONNECT
    // ==========================================================
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

export default initSocket;
