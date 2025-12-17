// controllers/auth.controller.js
import { generateToken } from "../lib/utils.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
// Import Prisma client: adjust this import to how you expose prisma in your project.
// Option A: if you export a singleton from ../lib/prisma.js
import prisma from "../lib/prisma.js";
// Option B (if you don't have a lib file) uncomment below and remove the previous import:
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        // profilePic will default to "" from prisma schema if not provided
      },
      // don't return password in response
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePic: true,
      },
    });

    if (newUser) {
      // generate jwt cookie (assumes generateToken accepts (userId, res) like earlier)
      generateToken(newUser.id, res);

      return res.status(201).json({
        _id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error in signup controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user.id, res);

    return res.status(200).json({
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in login controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    // Clear cookie set by generateToken
    res.cookie("jwt", "", { maxAge: 0 });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    // support both .id and ._id on req.user (middleware may set either)
    const userId = req.user?.id || req.user?._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePic: uploadResponse.secure_url },
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePic: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("error in update profile:", error);
    // handle case where prisma can't find the user
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    // req.user should be set by your auth middleware (token -> user)
    return res.status(200).json(req.user);
  } catch (error) {
    console.error("Error in checkAuth controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
