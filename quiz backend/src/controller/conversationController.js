import Conversation from "../models/Conversation.js";

//create conversations
export const createConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    const myId = req.userId;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (userId === myId) {
      return res.status(400).json({
        message: "Cannot start a conversation with yourself",
      });
    }

    // Check if a conversation already exists between these two users
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

    if (!conversation) {
      conversation = await Conversation.create({
        user1Id: myId,
        user2Id: userId,
      });
    }

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get conversations
export const getConversations = async (req, res) => {
  try {
    const myId = req.userId;

    const conversations = await Conversation.find({
      $or: [{ user1Id: myId }, { user2Id: myId }],
    })
      .populate("user1Id", "name email")
      .populate("user2Id", "name email")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get conversations
export const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate("user1Id", "name email")
      .populate("user2Id", "name email");

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const myId = req.userId;

    const isParticipant =
      conversation.user1Id._id.toString() === myId ||
      conversation.user2Id._id.toString() === myId;

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not a participant of this conversation",
      });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete conversations
export const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

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

    await conversation.deleteOne();

    res.json({
      message: "Conversation deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
