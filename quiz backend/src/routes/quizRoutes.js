import express from "express";

import {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  readyQuiz,
  startQuiz,
  restartQuiz,
} from "../controller/quizController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Anyone logged in can view quizzes
router.get("/", authMiddleware, getQuizzes);
router.get("/:id", authMiddleware, getQuizById);

// Only ADMIN can manage quizzes
router.post("/", authMiddleware, adminMiddleware, createQuiz);
router.put("/:id", authMiddleware, adminMiddleware, updateQuiz);
router.delete("/:id", authMiddleware, adminMiddleware, deleteQuiz);

// DRAFT → READY
router.patch("/:quizId/ready", authMiddleware, adminMiddleware, readyQuiz);

// READY → LIVE
router.post("/:quizId/start", authMiddleware, adminMiddleware, startQuiz);

// COMPLETED → READY
router.post("/:quizId/restart", authMiddleware, adminMiddleware, restartQuiz);

export default router;
