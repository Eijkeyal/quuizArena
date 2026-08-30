import express from "express";

import { getLeaderboard } from "../controller/leaderBoardController.js";
import { getQuizResult } from "../controller/quizResultController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// GET quiz leaderboard
router.get("/:quizId/leaderboard", authMiddleware, getLeaderboard);

// GET final quiz result
router.get("/:quizId/result", authMiddleware, getQuizResult);

export default router;
