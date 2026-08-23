import mongoose from "mongoose";
import User from "../models/user.js";

// ============================================================
// GET USERS FOR PRIVATE CHAT
// GET /users
// Returns every user except the currently logged-in user.
// ============================================================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.userId },
    }).select("_id name email role");

    return res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Failed to get users",
    });
  }
};

// ============================================================
// GET SINGLE USER
// GET /users/:id
// ============================================================
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select("_id name email role");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      message: "Failed to get user",
    });
  }
};

// ============================================================
// UPDATE OWN USER
// PUT /users/:id
// ============================================================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    // Users can only update their own account.
    if (id.toString() !== req.userId.toString()) {
      return res.status(403).json({
        message: "You can only update your own account",
      });
    }

    const { name, email } = req.body;

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      updateData.email = email;
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("_id name email role");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Update user error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// ============================================================
// DELETE OWN USER
// DELETE /users/:id
// ============================================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    // Users can only delete their own account.
    if (id.toString() !== req.userId.toString()) {
      return res.status(403).json({
        message: "You can only delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User deleted",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};
