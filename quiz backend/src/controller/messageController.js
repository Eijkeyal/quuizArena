import Message from "../models/message.js";
import Conversation from "../models/Conversation.js";

// message create
export const createMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderId = req.userId;

    if (!content) {
      return res.status(400).json({
        message: "Content is required",
      });
    }

    // find the conversation document
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const isParticipant =
      conversation.user1Id.toString() === senderId ||
      conversation.user2Id.toString() === senderId;

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not a participant of this conversation",
      });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
    });

    // Update conversation activity time
    conversation.updatedAt = new Date();
    await conversation.save();
    //broadcast messages in real time 
    const io = req.app.get("io");

    if (io) {
      io.to(conversationId).emit("newMessage", message);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

//get message
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const myId = req.userId;

    const isParticipant =
      conversation.user1Id.toString() === myId ||
      conversation.user2Id.toString() === myId;

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not a participant of this conversation",
      });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Return oldest to newest
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// update message
export const updateMessage = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        message: "Content is required",
      });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // Only sender can update
    if (message.senderId.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can only edit your own messages",
      });
    }

    message.content = content;
    await message.save();

    // broadcast Real-time update
    const io = req.app.get("io");

    if (io) {
      io.to(message.conversationId.toString()).emit("messageUpdated", message);
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// delete message
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // Only sender can delete
    if (message.senderId.toString() !== req.userId) {
      return res.status(403).json({
        message: "You can only delete your own messages",
      });
    }

    const conversationId = message.conversationId.toString();

    await message.deleteOne();
    const io = req.app.get("io");

    if (io) {
      io.to(conversationId).emit("messageDeleted", {
        id: req.params.id,
      });
    }

    res.json({
      message: "Message deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
