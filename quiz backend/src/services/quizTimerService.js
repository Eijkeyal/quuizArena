import Quiz from "../models/quiz.js";
import Question from "../models/question.js";
import QuizParticipant from "../models/quizParticipant.js";

const quizTimers = new Map();

export const startQuizTimer = async (quizId, io) => {
  try {
    const quiz = await Quiz.findById(quizId);

    if (!quiz || quiz.status !== "LIVE") {
      return;
    }

    const questions = await Question.find({ quizId }).sort({
      order: 1,
    });

    const currentQuestion = questions[quiz.currentQuestionIndex];

    if (!currentQuestion) {
      return;
    }

    if (quizTimers.has(quizId)) {
      clearTimeout(quizTimers.get(quizId));
    }

    const timer = setTimeout(async () => {
      try {
        const updatedQuiz = await Quiz.findById(quizId);

        if (!updatedQuiz || updatedQuiz.status !== "LIVE") {
          return;
        }

        const allQuestions = await Question.find({ quizId }).sort({
          order: 1,
        });

        const nextQuestionIndex = updatedQuiz.currentQuestionIndex + 1;

        if (nextQuestionIndex >= allQuestions.length) {
          updatedQuiz.status = "COMPLETED";
          updatedQuiz.endedAt = new Date();

          await updatedQuiz.save();

          const participants = await QuizParticipant.find({ quizId })
            .populate("userId", "name")
            .sort({ score: -1, updatedAt: 1 });

          const results = participants.map((participant, index) => ({
            rank: index + 1,
            userId: participant.userId._id,
            name: participant.userId.name,
            score: participant.score,
          }));

          const highestScore = results.length > 0 ? results[0].score : 0;

          const winners = results.filter(
            (participant) => participant.score === highestScore,
          );

          if (io) {
            io.to(`quiz:${quizId}`).emit("quizCompleted", {
              quizId,
              message: "Quiz has been completed",
              winners,
              results,
            });
          }

          quizTimers.delete(quizId);

          return;
        }

        updatedQuiz.currentQuestionIndex = nextQuestionIndex;
        updatedQuiz.currentQuestionStartedAt = new Date();

        await updatedQuiz.save();

        const nextQuestion = allQuestions[nextQuestionIndex];

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

        await startQuizTimer(quizId, io);
      } catch (error) {
        console.error("Quiz timer error:", error.message);
      }
    }, currentQuestion.timeLimit * 1000);

    quizTimers.set(quizId, timer);
  } catch (error) {
    console.error("Start quiz timer error:", error.message);
  }
};
