import express from "express";

import {
  createConversation,
  getConversations,
  getConversationById,
} from "../controller/conversationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a conversation
router.post("/", authMiddleware, createConversation);

// Get logged-in user's conversations
router.get("/", authMiddleware, getConversations);

// Get one conversation
router.get("/:conversationId", authMiddleware, getConversationById);

export default router;
