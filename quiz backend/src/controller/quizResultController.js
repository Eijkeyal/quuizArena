import Answer from "../models/answer.js";
import QuizParticipant from "../models/quizParticipant.js";

// ==========================================
// GET QUIZ LEADERBOARD
// ==========================================
export const getLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Get all participants
    const participants = await QuizParticipant.find({ quizId }).populate(
      "userId",
      "name",
    );

    // Build leaderboard using Answer data
    const leaderboard = await Promise.all(
      participants.map(async (participant) => {
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

        // Calculate total points
        const points = answers.reduce(
          (total, answer) => total + (answer.pointsEarned || 0),
          0,
        );

        return {
          userId: participant.userId._id,
          name: participant.userId.name,
          correctAnswers,
          wrongAnswers,
          points,
        };
      }),
    );

    // Sort by highest points
    leaderboard.sort((a, b) => {
      return b.points - a.points;
    });

    // Add rank after sorting
    const rankedLeaderboard = leaderboard.map((player, index) => ({
      rank: index + 1,
      ...player,
    }));

    return res.status(200).json({
      leaderboard: rankedLeaderboard,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// GET CURRENT USER QUIZ RESULT
// ==========================================
export const getQuizResult = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.userId;

    // Check that user participated
    const participant = await QuizParticipant.findOne({
      quizId,
      userId,
    });

    if (!participant) {
      return res.status(404).json({
        message: "You did not participate in this quiz",
      });
    }

    // Get all answers from this user for this quiz
    const answers = await Answer.find({
      quizId,
      userId,
    });

    // Correct answers
    const correctAnswers = answers.filter(
      (answer) => answer.isCorrect === true,
    ).length;

    // Wrong answers
    const wrongAnswers = answers.filter(
      (answer) => answer.isCorrect === false,
    ).length;

    // Total answers
    const totalAnswers = answers.length;

    // Calculate points directly from answers
    const totalPoints = answers.reduce(
      (total, answer) => total + (answer.pointsEarned || 0),
      0,
    );

    // Get all participants
    const participants = await QuizParticipant.find({ quizId }).populate(
      "userId",
      "name",
    );

    // Calculate each player's actual points
    const playerScores = await Promise.all(
      participants.map(async (player) => {
        const playerAnswers = await Answer.find({
          quizId,
          userId: player.userId._id,
        });

        const points = playerAnswers.reduce(
          (total, answer) => total + (answer.pointsEarned || 0),
          0,
        );

        return {
          userId: player.userId._id.toString(),
          points,
        };
      }),
    );

    // Sort using calculated points
    playerScores.sort((a, b) => b.points - a.points);

    // Find current user's rank
    const rank =
      playerScores.findIndex((player) => player.userId === userId.toString()) +
      1;

    return res.status(200).json({
      correctAnswers,
      wrongAnswers,
      totalAnswers,
      totalPoints,
      totalPoints: participant.score,
      rank,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
