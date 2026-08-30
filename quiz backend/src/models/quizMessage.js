import mongoose from "mongoose";

const quizMessageSchema = new mongoose.Schema(
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

quizMessageSchema.index({ quizId: 1, createdAt: 1 });

const QuizMessage = mongoose.model("QuizMessage", quizMessageSchema);

export default QuizMessage;
