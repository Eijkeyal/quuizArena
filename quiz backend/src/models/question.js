import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (options) {
          return options.length === 4;
        },
        message: "A question must have exactly 4 options",
      },
    },

    correctAnswer: {
      type: String,
      required: true,
    },

    timeLimit: {
      type: Number,
      required: true,
      default: 15,
      min: 5,
      max: 60,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent two questions from having the same order in one quiz
questionSchema.index({ quizId: 1, order: 1 }, { unique: true });

const Question = mongoose.model("Question", questionSchema);

export default Question;
