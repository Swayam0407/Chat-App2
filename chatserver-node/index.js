const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const Message = require("./server/models/Message"); // Import the Message model
require("dotenv").config();

// Import database connection
require("./config/db"); // Ensure this path matches where you put db.js

const app = express();
const port = process.env.PORT || 8080;



// Use CORS middleware
app.use(cors());

// Create HTTP server and initialize socket.io with the server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allows all origins
    methods: ["GET", "POST"], // Allowed methods
  },
});

app.get("/", (req, res) => {
  res.send("WebSocket server is running.");
});

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  // Join a room
  socket.on("join", (username) => {
    socket.join(username);
    console.log(`${username} joined the chat`);
    io.emit("chatroom/public", { senderName: username, status: "JOIN" });
  });

  // Public message
  socket.on("message", async (msg) => {
    console.log("Public message sent:", msg);

    // Save message to MongoDB
    const message = new Message({
      senderName: msg.senderName,
      message: msg.message,
      status: msg.status,
    });
    try {
      await message.save();
      io.emit("chatroom/public", msg);
    } catch (error) {
      console.error("Error saving public message:", error);
    }
  });

  // Private message
  socket.on("private-message", async (msg) => {
    console.log(
      `Private message from ${msg.senderName} to ${msg.receiverName}: ${msg.message}`
    );

    // Save private message to MongoDB
    const message = new Message({
      senderName: msg.senderName,
      receiverName: msg.receiverName,
      message: msg.message,
      status: msg.status,
    });
    try {
      await message.save();
      io.to(msg.receiverName).emit("private", msg); // Emit to the specific room
    } catch (error) {
      console.error("Error saving private message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

server.listen(port, () => {
  console.log("Server is running on http://localhost:8080");
});
