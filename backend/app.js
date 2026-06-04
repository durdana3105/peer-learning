import express from "express";
import { randomUUID } from "crypto";
import cors from "cors";
import cookieParser from "cookie-parser";
import chatRoutes from "./routers/chatRoutes.js";
import aiRoutes from "./routers/aiRoutes.js";
import matchRoutes from "./routers/matchRoutes.js";
import authRoutes from "./routers/authRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// SECURITY: Only trust proxy headers when explicitly configured.
// Set TRUST_PROXY=true for simple single-hop proxies (e.g., Heroku, Render).
// Set TRUSTED_PROXIES="10.0.0.0/8,172.16.0.0/12" for explicit subnet whitelisting (recommended).
// When neither is set, req.ip always returns the raw socket address, preventing X-Forwarded-For spoofing.
if (process.env.TRUSTED_PROXIES) {
  app.set("trust proxy", process.env.TRUSTED_PROXIES.split(",").map(s => s.trim()));
  console.log(`[security] trust proxy enabled for subnets: ${process.env.TRUSTED_PROXIES}`);
} else if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
  console.warn("[security] trust proxy enabled with hop-count 1. Consider setting TRUSTED_PROXIES for explicit subnet whitelisting.");
}

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
// Cap incoming JSON body size to 100 KB so a single oversized request
// cannot exhaust server memory or cause a denial-of-service condition.
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

app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
