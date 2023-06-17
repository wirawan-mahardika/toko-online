import express from 'express'
import cors from 'cors'
import passport from 'passport'
import session from 'express-session'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import sessionStore from "./config/session-store.js";
import { initializePassport, isAuthenticated } from "./config/passport.js";
import usersRoutes from "./routes/users-routes.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { jwtAuth } from "./config/jwt.js";
import { MemoryStore } from "express-session";
import { prismaClient } from "./database/prisma-client.js";

dotenv.config();
const app = express();
const corsConfig = {
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
  ],
  methods: ["POST", "DELETE", "PATCH", "PUT"],
  credentials: true,
};
const limiter = rateLimit({
  windowMs: 1000 * 60 * 10,
  max: 300,
  message: "Terlalu banyak melakukan permintaan, coba lagi nanti",
});
const sessionConfig = {
  secret: process.env.SESSION_COOKIE_SECRET,
  saveUninitialized: false,
  resave: false,
  store:
    process.env.STATUS == "testing" ? new MemoryStore() : sessionStore(session),
  cookie: {
    httpOnly: true,
    sameSite: true,
    maxAge: 1000 * 3600 * 24 * 7,
    signed: true,
    path: "/",
  },
};

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(cors(corsConfig));
app.use(cookieParser(process.env.SESSION_COOKIE_SECRET));
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
initializePassport(passport);

app.use("/api/users", usersRoutes);

app.get("/", async (req, res) => {
  const frontendURL = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(req.protocol, req.originalUrl, req.hostname, req.path);
  console.log(frontendURL);
  res.send("home page");
});
app.use((err, req, res, next) => {
  return res.json(err);
});

export default app