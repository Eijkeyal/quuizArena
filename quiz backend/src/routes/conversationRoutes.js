import express from "express";

import {
  createConversation,
  getConversations,
  getConversationById,
  deleteConversation,
} from "../controller/conversationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create/find a private conversation
router.post("/", authMiddleware, createConversation);

// Get logged-in user's conversations
router.get("/", authMiddleware, getConversations);

// Get one conversation
router.get("/:conversationId", authMiddleware, getConversationById);

// Delete a conversation
router.delete("/:conversationId", authMiddleware, deleteConversation);

export default router;
