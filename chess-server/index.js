import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// Track who is in which room
const rooms = {}; 

io.on("connection", (socket) => {
  socket.on("join-game", ({ gameId, username }) => {
    socket.join(gameId);
    if (!rooms[gameId]) rooms[gameId] = [];
    rooms[gameId].push({ id: socket.id, username });

    io.to(gameId).emit("player-data", rooms[gameId]);

    // If two players are in, tell them to START the clocks
    if (rooms[gameId].length === 2) {
      io.to(gameId).emit("start-clocks");
    }
  });

  socket.on("make-move", ({ gameId, fen }) => {
    socket.to(gameId).emit("move-received", fen);
  });

  socket.on("disconnect", () => {
    // Clean up room data on disconnect if needed
    console.log("User disconnected");
  });
});

httpServer.listen(3000, () => console.log("Server on http://localhost:3000"));