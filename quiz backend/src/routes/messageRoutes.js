import express from "express";

import {
  createMessage,
  getMessages,
  updateMessage,
  deleteMessage,
} from "../controller/messageController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

// ============================================================
// PRIVATE MESSAGES
// ============================================================

// POST /conversations/:conversationId/messages
router.post("/", authMiddleware, createMessage);

// GET /conversations/:conversationId/messages?page=1&limit=10
router.get("/", authMiddleware, getMessages);

// PUT /messages/:id
router.put("/:id", authMiddleware, updateMessage);

// DELETE /messages/:id
router.delete("/:id", authMiddleware, deleteMessage);

export default router;
