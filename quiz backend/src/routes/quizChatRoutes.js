import express from "express";

import {
  sendQuizMessage,
  getQuizMessages,
} from "../controller/quizChatController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get quiz chat messages
router.get("/:quizId/chat", authMiddleware, getQuizMessages);

// Send quiz chat message
router.post("/:quizId/chat", authMiddleware, sendQuizMessage);

export default router;
