import express from "express";

import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../controller/userController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ==================== USERS ====================

// ADMIN: Get all users
// GET /users
router.get("/", authMiddleware, getAllUsers);

// Get one user
// GET /users/:id
router.get("/:id", authMiddleware, getUser);

// Update own account
// PUT /users/:id
router.put("/:id", authMiddleware, updateUser);

// Delete own account
// DELETE /users/:id
router.delete("/:id", authMiddleware, deleteUser);

export default router;
