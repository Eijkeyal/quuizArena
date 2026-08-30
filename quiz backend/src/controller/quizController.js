import Quiz from "../models/quiz.js";
import Question from "../models/question.js";
import QuizParticipant from "../models/quizParticipant.js";
import Answer from "../models/answer.js";
import { startQuizTimer } from "../services/quizTimerService.js";

export const createQuiz = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Quiz title is required",
      });
    }

    const quiz = await Quiz.create({
      title: title.trim(),
      description: description?.trim() || "",
      createdBy: req.userId,
    });

    return res.status(201).json(quiz);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json(quizzes);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate(
      "createdBy",
      "name email role",
    );

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    return res.status(200).json(quiz);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { title, description } = req.body;

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (quiz.status !== "DRAFT" && quiz.status !== "COMPLETED") {
      return res.status(400).json({
        message: "Quiz cannot be edited while it is READY or LIVE",
      });
    }

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({
          message: "Quiz title cannot be empty",
        });
      }

      quiz.title = title.trim();
    }

    if (description !== undefined) {
      quiz.description = description?.trim() || "";
    }

    await quiz.save();

    return res.status(200).json({
      message: "Quiz updated successfully",
      quiz,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (quiz.status === "LIVE") {
      return res.status(400).json({
        message: "Cannot delete a live quiz",
      });
    }

    const quizId = quiz._id;

    await Question.deleteMany({
      quizId,
    });
    await QuizParticipant.deleteMany({
      quizId,
    });
    await Answer.deleteMany({
      quizId,
    });
    await quiz.deleteOne();

    return res.status(200).json({
      message: "Quiz and related data deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const readyQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (quiz.status !== "DRAFT") {
      return res.status(400).json({
        message: `Quiz cannot be marked as READY. Current status: ${quiz.status}`,
      });
    }

    const questionCount = await Question.countDocuments({
      quizId,
    });

    if (questionCount === 0) {
      return res.status(400).json({
        message: "Cannot mark quiz as READY without questions",
      });
    }

    quiz.status = "READY";
    quiz.currentQuestionIndex = 0;
    quiz.startedAt = null;
    quiz.currentQuestionStartedAt = null;

    await quiz.save();

    return res.status(200).json({
      message: "Quiz is ready to start",
      quiz,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const startQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (quiz.status !== "READY") {
      return res.status(400).json({
        message: `Quiz cannot be started. Current status: ${quiz.status}`,
      });
    }

    const questions = await Question.find({
      quizId,
    }).sort({
      order: 1,
    });

    if (questions.length === 0) {
      return res.status(400).json({
        message: "Cannot start a quiz without questions",
      });
    }

    // Start quiz
    quiz.status = "LIVE";
    quiz.currentQuestionIndex = 0;
    quiz.startedAt = new Date();
    quiz.currentQuestionStartedAt = new Date();

    await quiz.save();

    const io = req.app.get("io");

    // Never send correctAnswer to users
    const firstQuestion = {
      _id: questions[0]._id,
      question: questions[0].question,
      options: questions[0].options,
      timeLimit: questions[0].timeLimit,
      order: questions[0].order,
    };

    if (io) {
      io.to(`quiz:${quizId}`).emit("quizStarted", {
        quizId,
        currentQuestion: firstQuestion,
        questionIndex: 0,
      });

      await startQuizTimer(quizId, io);
    }

    return res.status(200).json({
      message: "Quiz started successfully",
      quiz,
      currentQuestion: firstQuestion,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const restartQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (quiz.status !== "COMPLETED") {
      return res.status(400).json({
        message: `Only a completed quiz can be restarted. Current status: ${quiz.status}`,
      });
    }

    // Make sure questions still exist
    const questionCount = await Question.countDocuments({
      quizId,
    });

    if (questionCount === 0) {
      return res.status(400).json({
        message: "Cannot restart a quiz without questions",
      });
    }

    await QuizParticipant.deleteMany({
      quizId,
    });
    await Answer.deleteMany({
      quizId,
    });
    quiz.status = "READY";
    quiz.currentQuestionIndex = 0;
    quiz.startedAt = null;
    quiz.currentQuestionStartedAt = null;

    await quiz.save();

    return res.status(200).json({
      message:
        "Quiz restarted successfully. Previous participants and answers were cleared.",
      quiz,
    });
  } catch (error) {
    console.error("Restart quiz error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};
