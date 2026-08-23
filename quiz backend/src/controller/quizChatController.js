import Message from "../models/message.js";
import Quiz from "../models/quiz.js";
import QuizParticipant from "../models/quizParticipant.js";

// SEND QUIZ CHAT MESSAGE
export const sendQuizMessage = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({
        message: "Message content is required",
      });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    const participant = await QuizParticipant.findOne({
      quizId,
      userId,
    });

    if (!participant) {
      return res.status(403).json({
        message: "You must join the quiz first",
      });
    }

    const message = await Message.create({
      conversationId: quizId,
      senderId: userId,
      content: content.trim(),
    });

    const io = req.app.get("io");

    if (io) {
      io.to(`quiz:${quizId}`).emit("newQuizMessage", message);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET QUIZ CHAT MESSAGES
export const getQuizMessages = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.userId;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    const participant = await QuizParticipant.findOne({
      quizId,
      userId,
    });

    if (!participant) {
      return res.status(403).json({
        message: "You must join the quiz first",
      });
    }

    const messages = await Message.find({
      conversationId: quizId,
    })
      .populate("senderId", "name")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
