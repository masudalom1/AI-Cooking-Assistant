import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRouter from "./routes/auth.route.js";
import aiRouter from "./routes/ai.route.js";
import cookieParser from "cookie-parser";
import job from "./lib/crons.js";
import cors from "cors";

dotenv.config();
const app = express();

//connect DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Database is connected.");
  } catch (error) {
    throw error;
  }
};

app.use(cors({
  origin: "*",        // 🔓 Allow all origins
  credentials: true,  // ⚠️ Note: This only works with specific origins, not "*"
}));

// middleware
app.use(express.json());
app.use(cookieParser());
job.start();

// api
app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);

// port listing
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
