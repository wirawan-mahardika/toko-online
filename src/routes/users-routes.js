import express from 'express'
import passport from 'passport'
import signupValidate from "../config/signupValidate.js";
import dotenv from "dotenv";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { ensureAuthenticated, isAuthenticated } from "../config/passport.js";
import { rateLimit } from "express-rate-limit";
import {
  addPhotoProfile,
  changePassword,
  forgetPassword,
  loginRoute,
  logoutRoute,
  refreshToken,
  signupRoute,
  validateEmail,
  validateOtp,
} from "../controller/users-controller.js";
import { prismaClient } from "../database/prisma-client.js";
import isImage from "../functions/mime-type-check.js";
import { jwtAuth } from "../config/jwt.js";

dotenv.config();
const limiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 5,
  handler: (req, res) => {
    return res.status(429).json({
      code: 429,
      message: "NOT OK",
      description: "Terlalu banyak melakukan percobaan login, coba lagi nanti",
    });
  },
});
const router = express.Router();

// login
router.post(
  "/login",
  ensureAuthenticated,
  limiter,
  passport.authenticate("local"),
  (err, req, res, next) => {
    if (err) {
      return res.status(401).json(err);
    }
    return next();
  },
  loginRoute
);

// lain-lain
router.delete("/logout", logoutRoute);
router.get("/refresh-token", isAuthenticated, refreshToken);
router.patch(
  "/add-photo-profile",
  isAuthenticated,
  jwtAuth,
  multer().single("photo"),
  addPhotoProfile
);

// route signup
router.post("/signup", signupValidate, signupRoute);
router.get("/validate-email/:token", validateEmail);

// Route lupa password
router.post("/forget-password/:id_user", forgetPassword);
router.post("/validate-otp/:id_user", validateOtp);
router.patch("/change-password/:id_user", changePassword);

export default router