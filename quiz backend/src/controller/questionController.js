import Question from "../models/question.js";
import Quiz from "../models/quiz.js";
export const createQuestion = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { question, options, correctAnswer, timeLimit, order } = req.body;

    // Check quiz exists
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }
    if (quiz.status === "LIVE") {
      return res.status(400).json({
        message: "Cannot add questions while the quiz is live",
      });
    }

    // Validate required fields
    if (
      !question ||
      !question.trim() ||
      !Array.isArray(options) ||
      options.length !== 4 ||
      !correctAnswer ||
      order === undefined
    ) {
      return res.status(400).json({
        message:
          "Question, exactly 4 options, correctAnswer and order are required",
      });
    }

    const newQuestion = await Question.create({
      quizId,
      question: question.trim(),
      options: options.map((option) => option.trim()),
      correctAnswer,
      timeLimit,
      order,
    });

    return res.status(201).json(newQuestion);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;

    const questions = await Question.find({ quizId }).sort({
      order: 1,
    });

    return res.status(200).json(questions);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    return res.status(200).json(question);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    // Find the quiz this question belongs to
    const quiz = await Quiz.findById(question.quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }
    if (quiz.status === "LIVE") {
      return res.status(400).json({
        message: "Cannot update questions while the quiz is live",
      });
    }

    const {
      question: questionText,
      options,
      correctAnswer,
      timeLimit,
      order,
    } = req.body;

    if (questionText !== undefined && !questionText.trim()) {
      return res.status(400).json({
        message: "Question cannot be empty",
      });
    }

    if (
      options !== undefined &&
      (!Array.isArray(options) || options.length !== 4)
    ) {
      return res.status(400).json({
        message: "Exactly 4 options are required",
      });
    }

    if (questionText !== undefined) {
      question.question = questionText.trim();
    }

    if (options !== undefined) {
      question.options = options.map((option) => option.trim());
    }

    if (correctAnswer !== undefined) {
      question.correctAnswer = correctAnswer;
    }

    if (timeLimit !== undefined) {
      question.timeLimit = timeLimit;
    }

    if (order !== undefined) {
      question.order = order;
    }

    await question.save();

    return res.status(200).json(question);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    // Find the quiz
    const quiz = await Quiz.findById(question.quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (quiz.status === "LIVE") {
      return res.status(400).json({
        message: "Cannot delete questions while the quiz is live",
      });
    }

    await question.deleteOne();

    return res.status(200).json({
      message: "Question deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
