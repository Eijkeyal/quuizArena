import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import quizParticipantRoutes from "./routes/quizParticipantRoutes.js";
import quizChatRoutes from "./routes/quizChatRoutes.js";
import answerRoutes from "./routes/answerRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";

import errorMiddleware from "./middleware/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

// Authentication
app.use("/auth", authRoutes);

// Users
app.use("/users", userRoutes);

// One-to-one conversations
app.use("/conversations", conversationRoutes);

// Messages
app.use("/conversations/:conversationId/messages", messageRoutes);
app.use("/messages", messageRoutes);

// Quiz management
app.use("/quizzes", quizRoutes);

// Questions
app.use("/", questionRoutes);

// Quiz participants
app.use("/quizzes", quizParticipantRoutes);

// Quiz chat
app.use("/quizzes", quizChatRoutes);

// Quiz answers
app.use("/quizzes", answerRoutes);

// Quiz results + leaderboard
app.use("/quizzes", resultRoutes);

// Error middleware must always be last
app.use(errorMiddleware);

export default app;
