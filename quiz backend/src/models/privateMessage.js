import mongoose from "mongoose";

const privateMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: false,
    },
  },
);

// Faster retrieval of messages in a conversation
privateMessageSchema.index({
  conversationId: 1,
  createdAt: 1,
});

const PrivateMessage = mongoose.model("PrivateMessage", privateMessageSchema);

export default PrivateMessage;
