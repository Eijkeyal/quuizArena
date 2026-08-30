import express from "express";

import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../controller/userController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getAllUsers);

router.get("/:id", authMiddleware, getUser);

router.put("/:id", authMiddleware, updateUser);

router.delete("/:id", authMiddleware, deleteUser);

export default router;
