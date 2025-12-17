// controllers/message.controller.js
import prisma from "../lib/prisma.js"; // adjust if your prisma export path differs
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

/**
 * Helper to normalize user id from req.user which might have `.id` or `._id`
 */
const getUserIdFromReq = (req) => req.user?.id || req.user?._id;

/**
 * Convert a Prisma Message record to the old Mongoose-style shape (map id -> _id)
 */
const mapMessageToResponse = (msg) => ({
  _id: msg.id,
  senderId: msg.senderId,
  receiverId: msg.receiverId,
  text: msg.text,
  image: msg.image,
  createdAt: msg.createdAt,
  updatedAt: msg.updatedAt,
});

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = getUserIdFromReq(req);
    if (!loggedInUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const users = await prisma.user.findMany({
      where: { id: { not: loggedInUserId } },
      // don't return password
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePic: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { fullName: "asc" },
    });

    // map id -> _id to keep compatibility with existing frontend
    const filteredUsers = users.map((u) => ({
      _id: u.id,
      fullName: u.fullName,
      email: u.email,
      profilePic: u.profilePic,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = getUserIdFromReq(req);
    if (!myId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    const response = messages.map(mapMessageToResponse);
    return res.status(200).json(response);
  } catch (error) {
    console.log("Error in getMessages controller: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = getUserIdFromReq(req);
    if (!senderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let imageUrl = null;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        text: text ?? null,
        image: imageUrl,
      },
    });

    const responseMessage = mapMessageToResponse(newMessage);

    // Emit to receiver via socket if they're connected
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", responseMessage);
    }

    return res.status(201).json(responseMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
