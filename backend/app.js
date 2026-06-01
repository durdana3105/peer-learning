import express from "express";
import { randomUUID } from "crypto";
import cors from "cors";
import authRoutes from "./routers/authRoutes.js";
import chatRoutes from "./routers/chatRoutes.js";
import aiRoutes from "./routers/aiRoutes.js";
import matchRoutes from "./routers/matchRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.set("trust proxy", 1);
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
// Cap incoming JSON body size to 100 KB so a single oversized request
// cannot exhaust server memory or cause a denial-of-service condition.
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
	req.requestId = req.headers["x-request-id"] || randomUUID();
	res.setHeader("x-request-id", req.requestId);
	next();
});

app.get("/health", (_req, res) => {
	res.status(200).json({ ok: true });
});

app.use("/api/ai", aiRoutes);
app.use("/api", authRoutes);
app.use("/api", chatRoutes);
app.use("/api/match", matchRoutes);

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
