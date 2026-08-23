import express from "express";
import { joinQuiz } from "../controller/quizParticipantController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /quizzes/:quizId/join
router.post("/:quizId/join", authMiddleware, joinQuiz);

export default router;
