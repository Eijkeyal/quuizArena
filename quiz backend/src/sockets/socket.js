import { verifyToken } from "../utils/jwt.js";

const initSocket = (io) => {
  // Authenticate socket using JWT
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

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (user ${socket.userId})`);

    // Join a quiz room
    socket.on("joinQuiz", (quizId) => {
      socket.join(`quiz:${quizId}`);

      console.log(`User ${socket.userId} joined quiz:${quizId}`);
    });

    // Leave a quiz room
    socket.on("leaveQuiz", (quizId) => {
      socket.leave(`quiz:${quizId}`);

      console.log(`User ${socket.userId} left quiz:${quizId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

export default initSocket;
