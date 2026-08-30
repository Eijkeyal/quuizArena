import Quiz from "../models/quiz.js";
import QuizParticipant from "../models/quizParticipant.js";

export const joinQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.userId;

    console.log("\n========== JOIN QUIZ ==========");
    console.log("quizId:", quizId);
    console.log("userId from token:", userId);
    console.log("================================\n");

    if (!userId) {
      return res.status(401).json({
        message: "User ID not found in authentication token",
      });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    console.log("Quiz found:", quiz._id.toString());
    console.log("Quiz status:", quiz.status);

    if (quiz.status === "COMPLETED") {
      return res.status(400).json({
        message: "This quiz has already ended",
      });
    }

    const existingParticipant = await QuizParticipant.findOne({
      quizId,
      userId,
    });

    console.log(
      "Existing participant:",
      existingParticipant
        ? {
            id: existingParticipant._id.toString(),
            quizId: existingParticipant.quizId.toString(),
            userId: existingParticipant.userId.toString(),
            score: existingParticipant.score,
          }
        : null,
    );

    if (existingParticipant) {
      console.log("User already joined.");

      return res.status(200).json({
        message: "You have already joined this quiz",
        participant: existingParticipant,
        alreadyJoined: true,
      });
    }

    const participant = await QuizParticipant.create({
      quizId,
      userId,
      score: 0,
      status: "JOINED",
    });

    console.log("\nNew participant created:");
    console.log("participantId:", participant._id.toString());
    console.log("saved quizId:", participant.quizId.toString());
    console.log("saved userId:", participant.userId.toString());
    console.log("score:", participant.score);

    const verifyParticipant = await QuizParticipant.findOne({
      quizId,
      userId,
    });

    console.log(
      "Verification after save:",
      verifyParticipant
        ? "SUCCESS - participant exists"
        : "FAILED - participant not found",
    );

    if (!verifyParticipant) {
      return res.status(500).json({
        message: "Failed to save quiz participant",
      });
    }

    return res.status(201).json({
      message: "Successfully joined the quiz",
      participant: verifyParticipant,
      alreadyJoined: false,
    });
  } catch (error) {
    console.error("JOIN QUIZ ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};
