import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    user1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate conversations between the same two users
conversationSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
