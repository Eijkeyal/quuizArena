import express from "express";

import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../controller/userController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ============================================================
// USERS
// ============================================================

// GET /users
// Get all users except the currently logged-in user
router.get("/", authMiddleware, getAllUsers);

// GET /users/:id
// Get one user
router.get("/:id", authMiddleware, getUser);

// PUT /users/:id
// Update own account
router.put("/:id", authMiddleware, updateUser);

// DELETE /users/:id
// Delete own account
router.delete("/:id", authMiddleware, deleteUser);

export default router;
