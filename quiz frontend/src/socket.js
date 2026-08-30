// socket.js — the ONLY file that talks WebSocket to your backend.
// Your backend should emit "quiz:update" (full quiz object, same shape as
// the REST Quiz) to everyone in room `quiz:<id>` whenever anything changes:
// a join, an answer/score update, a question advance, or completion.
// This is what powers the "Real-time Leaderboard" step in the flow.
import { io } from "socket.io-client";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
      auth: { token: localStorage.getItem("token") },
      autoConnect: false,
    });
  }
  return socket;
}

// Join the room for one quiz and subscribe to its updates.
// Returns an unsubscribe function — call it in your useEffect cleanup.
export function watchQuiz(quizId, onUpdate) {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit("quiz:watch", { quizId });
  s.on("quiz:update", onUpdate);
  return () => {
    s.emit("quiz:unwatch", { quizId });
    s.off("quiz:update", onUpdate);
  };
}
