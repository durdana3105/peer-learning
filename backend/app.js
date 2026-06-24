import express from "express";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import chatRoutes from "./routers/chatRoutes.js";
import aiRoutes from "./routers/aiRoutes.js";
import matchRoutes from "./routers/matchRoutes.js";
import authRoutes from "./routers/authRoutes.js";
import uploadRoutes from "./routers/uploadRoutes.js";
import cronRoutes from "./routers/cronRoutes.js";
import notificationRoutes from "./routers/notificationRoutes.js";
import userRoutes from "./routes/users.js";
import reviewRoutes from "./routers/reviewRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// SECURITY: Only trust proxy headers when explicitly configured.
if (process.env.TRUSTED_PROXIES) {
  app.set("trust proxy", process.env.TRUSTED_PROXIES.split(",").map(s => s.trim()));
  console.log(`[security] trust proxy enabled for subnets: ${process.env.TRUSTED_PROXIES}`);
} else if (process.env.TRUST_PROXY === "true") {
  console.error("[security] FATAL: TRUST_PROXY=true is insecure without TRUSTED_PROXIES. Provide comma-separated subnet ranges via TRUSTED_PROXIES.");
  process.exit(1);
}

// SECURITY: Build a strict CORS origin whitelist.
// - FRONTEND_URL can be a single URL or comma-separated list (e.g., "https://app.example.com,https://staging.example.com").
// - In production, the server refuses to start if FRONTEND_URL is missing.
// - In development, it defaults to common localhost origins for convenience.
const buildAllowedOrigins = () => {
  const raw = process.env.FRONTEND_URL;

  if (raw) {
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }

  if (process.env.NODE_ENV === "production") {
    console.error("[security] FATAL: FRONTEND_URL is not set. Refusing to start with a wildcard CORS policy in production.");
    process.exit(1);
  }

  console.warn("[security] FRONTEND_URL not set. Defaulting to localhost origins for development.");
  return ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"];
};

const allowedOrigins = new Set(buildAllowedOrigins());

app.use(cors({
  origin: (origin, callback) => {
    // Strictly require origin to match the whitelist to prevent no-origin bypasses
    if (allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  req.requestId = req.headers["x-request-id"] || randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for AI to prevent OPENROUTER_API_KEY exhaustion
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 AI requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests from this IP, please try again after 15 minutes" }
});

app.use("/api", apiLimiter);
app.use("/api/ai", aiLimiter);

app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
