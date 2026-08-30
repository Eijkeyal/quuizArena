import mongoose from "mongoose";

const quizParticipantSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["JOINED", "COMPLETED"],
      default: "JOINED",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// One user can join one quiz only once
quizParticipantSchema.index(
  {
    quizId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);

const QuizParticipant = mongoose.model(
  "QuizParticipant",
  quizParticipantSchema,
);

export default QuizParticipant;
