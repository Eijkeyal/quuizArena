import Quiz from "../models/quiz.js";
import Question from "../models/question.js";
import QuizParticipant from "../models/quizParticipant.js";

// Store active quiz timers
const quizTimers = new Map();

export const startQuizTimer = async (quizId, io) => {
  try {
    // Get quiz
    const quiz = await Quiz.findById(quizId);

    if (!quiz || quiz.status !== "LIVE") {
      return;
    }

    // Get all questions in order
    const questions = await Question.find({ quizId }).sort({
      order: 1,
    });

    const currentQuestion = questions[quiz.currentQuestionIndex];

    if (!currentQuestion) {
      return;
    }

    // Clear old timer if it exists
    if (quizTimers.has(quizId)) {
      clearTimeout(quizTimers.get(quizId));
    }

    // Start timer for current question
    const timer = setTimeout(async () => {
      try {
        const updatedQuiz = await Quiz.findById(quizId);

        if (!updatedQuiz || updatedQuiz.status !== "LIVE") {
          return;
        }

        // Get all questions again
        const allQuestions = await Question.find({ quizId }).sort({
          order: 1,
        });

        // Move to next question
        const nextQuestionIndex = updatedQuiz.currentQuestionIndex + 1;

        // ==========================================
        // LAST QUESTION FINISHED → COMPLETE THE QUIZ
        // ==========================================
        if (nextQuestionIndex >= allQuestions.length) {
          updatedQuiz.status = "COMPLETED";
          updatedQuiz.endedAt = new Date();

          await updatedQuiz.save();

          // Get final leaderboard
          const participants = await QuizParticipant.find({ quizId })
            .populate("userId", "name")
            .sort({ score: -1, updatedAt: 1 });

          // Format final results
          const results = participants.map((participant, index) => ({
            rank: index + 1,
            userId: participant.userId._id,
            name: participant.userId.name,
            score: participant.score,
          }));

          // Find the highest score
          const highestScore = results.length > 0 ? results[0].score : 0;

          // Support multiple winners in case of a tie
          const winners = results.filter(
            (participant) => participant.score === highestScore,
          );

          // Send final results to everyone
          if (io) {
            io.to(`quiz:${quizId}`).emit("quizCompleted", {
              quizId,
              message: "Quiz has been completed",
              winners,
              results,
            });
          }

          // Remove completed quiz timer
          quizTimers.delete(quizId);

          return;
        }

        // ==========================================
        // START NEXT QUESTION
        // ==========================================

        updatedQuiz.currentQuestionIndex = nextQuestionIndex;
        updatedQuiz.currentQuestionStartedAt = new Date();

        await updatedQuiz.save();

        const nextQuestion = allQuestions[nextQuestionIndex];

        // Send next question without correctAnswer
        if (io) {
          io.to(`quiz:${quizId}`).emit("nextQuestion", {
            quizId,
            question: {
              _id: nextQuestion._id,
              question: nextQuestion.question,
              options: nextQuestion.options,
              timeLimit: nextQuestion.timeLimit,
              order: nextQuestion.order,
            },
            questionIndex: nextQuestionIndex,
          });
        }

        // Start timer for next question
        await startQuizTimer(quizId, io);
      } catch (error) {
        console.error("Quiz timer error:", error.message);
      }
    }, currentQuestion.timeLimit * 1000);

    // Store timer
    quizTimers.set(quizId, timer);
  } catch (error) {
    console.error("Start quiz timer error:", error.message);
  }
};
