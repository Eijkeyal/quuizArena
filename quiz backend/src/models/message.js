import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
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

messageSchema.index({ quizId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
