import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    selectedAnswer: {
      type: String,
      required: true,
      trim: true,
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },

    pointsEarned: {
      type: Number,
      default: 0,
    },

    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

// A user can answer each question only once
answerSchema.index(
  {
    questionId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);

const Answer = mongoose.model("Answer", answerSchema);

export default Answer;
