import express from "express";

import { submitAnswer } from "../controller/answerController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Submit an answer
router.post(
  "/:quizId/questions/:questionId/answer",
  authMiddleware,
  submitAnswer,
);

export default router;
