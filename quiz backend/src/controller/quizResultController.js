import Answer from "../models/answer.js";
import QuizParticipant from "../models/quizParticipant.js";

export const getLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;

    const participants = await QuizParticipant.find({ quizId }).populate(
      "userId",
      "name",
    );

    const leaderboard = await Promise.all(
      participants.map(async (participant) => {
        const answers = await Answer.find({
          quizId,
          userId: participant.userId._id,
        });

        const correctAnswers = answers.filter(
          (answer) => answer.isCorrect === true,
        ).length;

        const wrongAnswers = answers.filter(
          (answer) => answer.isCorrect === false,
        ).length;

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

    leaderboard.sort((a, b) => {
      return b.points - a.points;
    });

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

export const getQuizResult = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.userId;

    const participant = await QuizParticipant.findOne({
      quizId,
      userId,
    });

    if (!participant) {
      return res.status(404).json({
        message: "You did not participate in this quiz",
      });
    }

    const answers = await Answer.find({
      quizId,
      userId,
    });

    const correctAnswers = answers.filter(
      (answer) => answer.isCorrect === true,
    ).length;

    const wrongAnswers = answers.filter(
      (answer) => answer.isCorrect === false,
    ).length;

    const totalAnswers = answers.length;

    const totalPoints = answers.reduce(
      (total, answer) => total + (answer.pointsEarned || 0),
      0,
    );

    const participants = await QuizParticipant.find({ quizId }).populate(
      "userId",
      "name",
    );

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

    playerScores.sort((a, b) => b.points - a.points);

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
