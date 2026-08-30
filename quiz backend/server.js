import dotenv from "dotenv";
dotenv.config();
import http from "http";
import { Server } from "socket.io";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import initSocket from "./src/sockets/socket.js";

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB();

    // Create the HTTP server usng node
    const httpServer = http.createServer(app);

    // Add Socket.IO to the HTTP server
    const io = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });

    // Make io available in Express controllers
    app.set("io", io);

    initSocket(io);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
