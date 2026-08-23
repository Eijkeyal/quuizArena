import express from "express";

import { joinQuiz } from "../controller/quizParticipantController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// USER joins a quiz
router.post("/:quizId/join", authMiddleware, joinQuiz);

export default router;
