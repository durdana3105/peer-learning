import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routers/authRoutes.js";
import chatRoutes from "./routers/chatRoutes.js";
import matchRoutes from "./routers/matchRoutes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.set("trust proxy", 1);
// Cap incoming JSON body size to 100 KB so a single oversized request
// cannot exhaust server memory or cause a denial-of-service condition.
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => {
	res.status(200).json({ ok: true });
});

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (mongoUri) {
	mongoose
		.connect(mongoUri)
		.then(() => {
			console.log("MongoDB connected");
		})
		.catch((error) => {
			console.error("MongoDB connection failed:", error);
		});
} else {
	console.warn("MONGO_URI is not configured; auth and recommendation routes will fail until it is set.");
}

app.use("/api", authRoutes);
app.use("/api", chatRoutes);
app.use("/api/match", matchRoutes);

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Centralised error handler. Avoids leaking stack traces to clients in
// production while still surfacing a helpful message in development.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status ?? 500;
  const message =
    process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  res.status(status).json({ error: message });
});

app.listen(port, () => {
	console.log(`Backend server listening on port ${port}`);
});