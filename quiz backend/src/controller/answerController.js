import Answer from "../models/answer.js";
import Quiz from "../models/quiz.js";
import Question from "../models/question.js";
import QuizParticipant from "../models/quizParticipant.js";

export const submitAnswer = async (req, res) => {
  try {
    const { quizId, questionId } = req.params;
    const { selectedAnswer } = req.body;
    const userId = req.userId;

    console.log("\n========== SUBMIT ANSWER ==========");
    console.log("quizId:", quizId);
    console.log("questionId:", questionId);
    console.log("userId:", userId);
    console.log("selectedAnswer:", selectedAnswer);
    console.log("===================================\n");

    if (!selectedAnswer || !selectedAnswer.trim()) {
      return res.status(400).json({
        message: "Selected answer is required",
      });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    console.log("Quiz status:", quiz.status);

    if (quiz.status !== "LIVE") {
      return res.status(400).json({
        message: "Quiz is not currently live",
      });
    }

    console.log("Searching participant with:");
    console.log({
      quizId,
      userId,
    });

    const participant = await QuizParticipant.findOne({
      quizId,
      userId,
    });

    console.log("Participant found:", participant);

    if (!participant) {
      return res.status(403).json({
        message: "You must join the quiz first",
      });
    }

    const questions = await Question.find({
      quizId,
    }).sort({
      order: 1,
    });

    const currentQuestion = questions[quiz.currentQuestionIndex];

    if (!currentQuestion) {
      return res.status(400).json({
        message: "No active question",
      });
    }

    console.log("Current question:", currentQuestion._id.toString());

    if (currentQuestion._id.toString() !== questionId.toString()) {
      return res.status(400).json({
        message: "This is not the current active question",
      });
    }

    if (!quiz.currentQuestionStartedAt) {
      return res.status(400).json({
        message: "Question has not started yet",
      });
    }

    const questionStartTime = new Date(quiz.currentQuestionStartedAt).getTime();

    const timePassedInSeconds = (Date.now() - questionStartTime) / 1000;

    if (timePassedInSeconds > currentQuestion.timeLimit) {
      return res.status(400).json({
        message: "Time has expired for this question",
      });
    }

    const existingAnswer = await Answer.findOne({
      quizId,
      questionId,
      userId,
    });

    if (existingAnswer) {
      return res.status(409).json({
        message: "You already answered this question",
      });
    }

    const isCorrect =
      selectedAnswer.trim() === currentQuestion.correctAnswer.trim();

    console.log("Is correct:", isCorrect);

    let pointsEarned = 0;

    if (isCorrect) {
      const correctAnswersCount = await Answer.countDocuments({
        quizId,
        questionId,
        isCorrect: true,
      });

      if (correctAnswersCount === 0) {
        pointsEarned = 10;
      } else if (correctAnswersCount === 1) {
        pointsEarned = 7;
      } else if (correctAnswersCount === 2) {
        pointsEarned = 5;
      } else {
        pointsEarned = 3;
      }
    }

    console.log("Points earned:", pointsEarned);

    const answer = await Answer.create({
      quizId,
      questionId,
      userId,
      selectedAnswer: selectedAnswer.trim(),
      isCorrect,
      pointsEarned,
      answeredAt: new Date(),
    });

    console.log("Answer saved:", answer._id.toString());

    if (isCorrect) {
      participant.score += pointsEarned;
      await participant.save();

      console.log("Updated participant score:", participant.score);
    }

    const leaderboard = await QuizParticipant.find({
      quizId,
    })
      .populate("userId", "name")
      .sort({
        score: -1,
        updatedAt: 1,
      });

    const formattedLeaderboard = leaderboard.map(
      (leaderboardParticipant, index) => ({
        rank: index + 1,
        userId:
          leaderboardParticipant.userId?._id || leaderboardParticipant.userId,
        name: leaderboardParticipant.userId?.name || "Unknown User",
        score: leaderboardParticipant.score,
      }),
    );

    console.log("Leaderboard:", formattedLeaderboard);

    const io = req.app.get("io");

    if (io) {
      io.to(`quiz:${quizId}`).emit("leaderboardUpdated", formattedLeaderboard);
    }

    return res.status(201).json({
      message: "Answer submitted successfully",
      isCorrect,
      pointsEarned,
      answer,
      leaderboard: formattedLeaderboard,
    });
  } catch (error) {
    console.error("SUBMIT ANSWER ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};
