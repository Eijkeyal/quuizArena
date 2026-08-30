import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["DRAFT", "READY", "LIVE", "COMPLETED"],
      default: "DRAFT",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Which question is currently active?
    currentQuestionIndex: {
      type: Number,
      default: -1,
    },

    // When the quiz started
    startedAt: {
      type: Date,
      default: null,
    },

    // When the current question started
    currentQuestionStartedAt: {
      type: Date,
      default: null,
    },

    // When the quiz finished
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
