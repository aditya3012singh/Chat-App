// routes/message.routes.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

// Fetch all users except logged-in user (sidebar list)
router.get("/users", protectRoute, getUsersForSidebar);

// Fetch chat conversation with a specific user
router.get("/:id", protectRoute, getMessages);

// Send message to a user
router.post("/send/:id", protectRoute, sendMessage);

export default router;
