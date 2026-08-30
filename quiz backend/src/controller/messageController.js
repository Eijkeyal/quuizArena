import mongoose from "mongoose";
import PrivateMessage from "../models/privateMessage.js";
import Conversation from "../models/Conversation.js";

export const createMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderId = req.userId;

    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    // Validate content
    if (!content || !content.trim()) {
      return res.status(400).json({
        message: "Content is required",
      });
    }
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }
    const isParticipant =
      conversation.user1Id.toString() === senderId.toString() ||
      conversation.user2Id.toString() === senderId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not a participant of this conversation",
      });
    }

    // Create message
    let message = await PrivateMessage.create({
      conversationId,
      senderId,
      content: content.trim(),
    });
    message = await message.populate("senderId", "name email");

    // Update conversation activity
    conversation.updatedAt = new Date();
    await conversation.save();

    // Get Socket.IO instance
    const io = req.app.get("io");

    // Broadcast to both users in conversation
    if (io) {
      io.to(`conversation:${conversationId}`).emit("newMessage", message);
    }

    return res.status(201).json(message);
  } catch (error) {
    console.error("Create private message error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 20;

    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    // Prevent invalid pagination
    page = Math.max(page, 1);
    limit = Math.min(Math.max(limit, 1), 100);

    // Find conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const myId = req.userId;

    const isParticipant =
      conversation.user1Id.toString() === myId.toString() ||
      conversation.user2Id.toString() === myId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not a participant of this conversation",
      });
    }

    // Get messages
    const messages = await PrivateMessage.find({
      conversationId,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("senderId", "name email");
    messages.reverse();

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Get private messages error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        message: "Content is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid message ID",
      });
    }

    const message = await PrivateMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }
    if (message.senderId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        message: "You can only edit your own messages",
      });
    }

    message.content = content.trim();

    await message.save();

    const updatedMessage = await message.populate("senderId", "name email");

    // Broadcast update to conversation room
    const io = req.app.get("io");

    if (io) {
      io.to(`conversation:${message.conversationId}`).emit(
        "messageUpdated",
        updatedMessage,
      );
    }

    return res.status(200).json(updatedMessage);
  } catch (error) {
    console.error("Update private message error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid message ID",
      });
    }

    const message = await PrivateMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    if (message.senderId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        message: "You can only delete your own messages",
      });
    }

    const conversationId = message.conversationId.toString();
    const messageId = message._id.toString();

    await message.deleteOne();
    const io = req.app.get("io");

    if (io) {
      io.to(`conversation:${conversationId}`).emit("messageDeleted", {
        id: messageId,
      });
    }

    return res.status(200).json({
      message: "Message deleted",
    });
  } catch (error) {
    console.error("Delete private message error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};
