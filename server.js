/* ======================================================
   Campground Guides Backend - server.js
   Clean, stable, correct version with working CORS + routes
   ====================================================== */

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import sgMail from "@sendgrid/mail";
import morgan from "morgan";
import checkoutRoutes from "./routes/checkout.js";

dotenv.config();

// ----------------------
// Basic Config
// ----------------------
const app = express();
app.set("trust proxy", 1);

// ----------------------
// CORS Configuration (MANUAL — FIXES OPTIONS HEADERS)
// ----------------------
const allowedOrigins = [
  "https://campgroundguides.com",
  "https://www.campgroundguides.com",
  "https://affiliate.campgroundguides.com",
  "https://multi-park.campgroundguides.com",
  "http://localhost:3000",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ----------------------
// JSON + Logging
// ----------------------
app.use(express.json());
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms")
);

// ----------------------
// ROUTES
// ----------------------
app.use("/api", checkoutRoutes);

// ----------------------
// Environment Validation
// ----------------------
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) console.error("❌ Missing SENDGRID_API_KEY");
if (!MONGODB_URI) console.error("❌ Missing MONGODB_URI");

// ----------------------
// SendGrid Setup
// ----------------------
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// ----------------------
// MongoDB / Mongoose Setup
// ----------------------
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) =>
      console.error("❌ MongoDB connection error:", err.message)
    );
}

// ----------------------
// Start Server
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
