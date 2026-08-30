import Quiz from "../models/quiz.js";
import QuizParticipant from "../models/quizParticipant.js";
import Answer from "../models/answer.js";

export const getLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }
    const participants = await QuizParticipant.find({ quizId })
      .populate("userId", "name email")
      .sort({
        score: -1,
        updatedAt: 1,
      });

    //Calculate correct answers and points for each participant
    const leaderboard = await Promise.all(
      participants.map(async (participant, index) => {
        const answers = await Answer.find({
          quizId,
          userId: participant.userId._id,
        });

        // Count correct answers
        const correctAnswers = answers.filter(
          (answer) => answer.isCorrect === true,
        ).length;

        // Count wrong answers
        const wrongAnswers = answers.filter(
          (answer) => answer.isCorrect === false,
        ).length;

        // Calculate points directly from Answer collection
        const totalPoints = answers.reduce(
          (total, answer) => total + (answer.pointsEarned || 0),
          0,
        );

        return {
          rank: index + 1,
          userId: participant.userId?._id,
          name: participant.userId?.name || "Unknown User",
          email: participant.userId?.email || "",

          correctAnswers,
          wrongAnswers,
          totalPoints,
          score: participant.score,

          status: participant.status,
        };
      }),
    );

    return res.status(200).json({
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        status: quiz.status,
      },

      totalParticipants: leaderboard.length,

      leaderboard,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
