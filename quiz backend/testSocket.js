import { io } from "socket.io-client";

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTgzNDk4YjFhNjI4MjY3NmU5OWM5YzQiLCJpYXQiOjE3ODY5ODg5MzksImV4cCI6MTc4NzU5MzczOX0.WTQ9rsMWlPx-AKICrUOts-1ju1i5h0_nDPkqqnQ2pDY";

const socket = io("http://localhost:3000", {
  auth: {
    token,
  },
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // Join the conversation
  socket.emit("joinConversation", "6a834a191a6282676e99c9c5");

  console.log("Joined conversation");
});

socket.on("newMessage", (message) => {
  console.log("NEW MESSAGE RECEIVED:");
  console.log(message);
});

socket.on("connect_error", (error) => {
  console.log("Connection error:", error.message);
});
