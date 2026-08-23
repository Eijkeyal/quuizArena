import express from "express";

import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
} from "../controller/questionController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Questions belonging to a quiz
router.post(
  "/quizzes/:quizId/questions",
  authMiddleware,
  adminMiddleware,
  createQuestion,
);

router.get("/quizzes/:quizId/questions", authMiddleware, getQuestions);

// Individual question
router.get("/questions/:id", authMiddleware, getQuestionById);

router.put("/questions/:id", authMiddleware, adminMiddleware, updateQuestion);

router.delete(
  "/questions/:id",
  authMiddleware,
  adminMiddleware,
  deleteQuestion,
);

export default router;
