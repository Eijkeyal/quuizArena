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

app.use("/auth", authRoutes);

app.use("/users", userRoutes);

app.use("/conversations", conversationRoutes);

app.use("/conversations/:conversationId/messages", messageRoutes);
app.use("/messages", messageRoutes);

app.use("/quizzes", quizRoutes);

app.use("/", questionRoutes);

app.use("/quizzes", quizParticipantRoutes);

app.use("/quizzes", quizChatRoutes);

app.use("/quizzes", answerRoutes);

app.use("/quizzes", resultRoutes);

app.use(errorMiddleware);

export default app;
