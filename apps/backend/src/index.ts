import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { config } from "dotenv";
import path from "path";
import fs from "fs-extra";

import { errorHandler } from "@/middleware/errorHandler";
import { validateEnv } from "@/utils/validateEnv";
import extractRoutes from "@/routes/extract";
import exportRoutes from "@/routes/export";
import healthRoutes from "@/routes/health";

// Load environment variables
config();

// Validate environment variables
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

// Create necessary directories
const createDirectories = async () => {
  const dirs = [
    process.env.UPLOAD_DIR || "./uploads",
    process.env.TEMP_DIR || "./temp",
  ];

  for (const dir of dirs) {
    await fs.ensureDir(path.resolve(dir));
  }
};

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // 100 requests per window
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(compression());
app.use(limiter);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/extract", extractRoutes);
app.use("/api/export", exportRoutes);

// Global error handler
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

const startServer = async () => {
  try {
    await createDirectories();

    app.listen(PORT, () => {
      console.log(`🚀 PDFProspector API Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `🔗 CORS Origin: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`
      );
      const mask = (s?: string) =>
        s ? s.slice(0, 8) + "..." + s.slice(-6) : "none";
      console.log("OPENAI key:", mask(process.env.OPENAI_API_KEY));
      console.log("ANTHROPIC key:", mask(process.env.ANTHROPIC_API_KEY));
      if (process.env.NODE_ENV !== "production") {
        console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
        console.log(`📤 Upload PDF: http://localhost:${PORT}/api/extract`);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();
