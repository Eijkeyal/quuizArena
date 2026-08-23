import express from "express";

import {
  createMessage,
  getMessages,
  updateMessage,
  deleteMessage,
} from "../controller/messageController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a message in a conversation
// POST /conversations/:conversationId/messages
router.post("/", authMiddleware, createMessage);

// Get messages from a conversation
// GET /conversations/:conversationId/messages?page=1&limit=10
router.get("/", authMiddleware, getMessages);

// Update a message
// PUT /messages/:id
router.put("/:id", authMiddleware, updateMessage);

// Delete a message
// DELETE /messages/:id
router.delete("/:id", authMiddleware, deleteMessage);

export default router;
