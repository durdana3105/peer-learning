import express from "express";
import authRoutes from "./routers/authRoutes.js";
import chatRoutes from "./routers/chatRoutes.js";
import matchRoutes from "./routers/matchRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json());

app.get("/health", (_req, res) => {
	res.status(200).json({ ok: true });
});

app.use("/api", authRoutes);
app.use("/api", chatRoutes);
app.use("/api/match", matchRoutes);

app.listen(port, () => {
	console.log(`Backend server listening on port ${port}`);
});