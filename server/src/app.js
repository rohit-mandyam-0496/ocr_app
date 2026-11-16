import cors from "cors";
import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import verificationRouter from "./routes/verificationRoutes.js";

const app = express();

app.use(helmet());
console.log("helmet middleware loaded");

app.use(cors());
console.log("cors middleware loaded");

app.use(morgan("combined"));
console.log("morgan middleware loaded");

app.use(express.json({ limit: "100kb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/health", (_req, res) =>
  res.status(200).json({ status: "ok, healthy" }),
);

app.use("/api/verifications", verificationRouter);

app.use((error, _req, res, _next) => {
  if (error.code === "LIMIT_FILE_SIZE")
    return res.status(413).json({ message: "Image must be 5 MB or smaller." });
  console.error(error);
  res.status(500).json({ message: "Unable to process this document." });
});

export default app;
