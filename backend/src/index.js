// server.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app as socketApp, server } from "./lib/socket.js";
import prisma from "./lib/prisma.js"; // Prisma client (single instance)

dotenv.config();

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const __dirname = path.resolve();

// The Socket file exports `app` (Express instance) and `server` (http server).
// We named the import `socketApp` to remind that it's the same Express app used by socket.io
const app = socketApp;

// Middleware
// Increase limit to allow base64 image payloads if you upload images as strings
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Start server and connect Prisma
const start = async () => {
  try {
    await prisma.$connect();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
};

start();

// Graceful shutdown — ensures Prisma client disconnects and server closes
const shutdown = async () => {
  console.log("Shutting down gracefully...");
  try {
    await prisma.$disconnect();
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  } catch (err) {
    console.error("Error during shutdown", err);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
