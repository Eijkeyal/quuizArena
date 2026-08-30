import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import User from "../models/user.js";

export const createConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    const myId = req.userId;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    // Cannot chat with yourself
    if (userId.toString() === myId.toString()) {
      return res.status(400).json({
        message: "Cannot start a conversation with yourself",
      });
    }

    // Check whether target user exists
    const otherUser = await User.findById(userId);

    if (!otherUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      $or: [
        {
          user1Id: myId,
          user2Id: userId,
        },
        {
          user1Id: userId,
          user2Id: myId,
        },
      ],
    });

    // Create only if it doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        user1Id: myId,
        user2Id: userId,
      });
    }

    // Return populated users
    conversation = await Conversation.findById(conversation._id)
      .populate("user1Id", "name email role")
      .populate("user2Id", "name email role");

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Create conversation error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};
export const getConversations = async (req, res) => {
  try {
    const myId = req.userId;

    const conversations = await Conversation.find({
      $or: [{ user1Id: myId }, { user2Id: myId }],
    })
      .populate("user1Id", "name email role")
      .populate("user2Id", "name email role")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const myId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate("user1Id", "name email role")
      .populate("user2Id", "name email role");

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }
    const isParticipant =
      conversation.user1Id._id.toString() === myId.toString() ||
      conversation.user2Id._id.toString() === myId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not a participant of this conversation",
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Get conversation error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const myId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Make sure logged-in user belongs to conversation
    const isParticipant =
      conversation.user1Id.toString() === myId.toString() ||
      conversation.user2Id.toString() === myId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not a participant of this conversation",
      });
    }

    await conversation.deleteOne();

    res.status(200).json({
      message: "Conversation deleted",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};
