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
