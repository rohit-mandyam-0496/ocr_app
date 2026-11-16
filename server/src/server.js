import "dotenv/config";

import mongoose from "mongoose";

import app from "./app.js";

const port = Number(process.env.PORT) || 5000;

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
    throw new Error(
      "Set JWT_SECRET to a random value with at least 24 characters",
    );
  }
  await mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Connected to Database!!");
    })
    .catch((error) => {
      console.log("Error connecting to Database:", error);
    });
  app.listen(port, () => console.log(`KYC API listening on port ${port}`));
}

start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
