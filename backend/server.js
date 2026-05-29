import dotenv from "dotenv";
// import authRoutes from "./routers/authRoutes.js";
// import chatRoutes from "./routers/chatRoutes.js";  // 👈 ADD THIS
// import aiRoutes from "./routers/aiRoutes.js";
import express from "express";

dotenv.config(); // must be first
import authRoutes from "./routers/authRoutes.js";
import chatRoutes from "./routers/chatRoutes.js";
import aiRoutes from "./routers/aiRoutes.js";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;
app.use("/api/ai", aiRoutes);
app.use("/api", authRoutes);
app.use("/api", chatRoutes);

// app.use("/api/ai", aiRoutes);
// app.use("/api", authRoutes);
// app.use("/api", chatRoutes); // 👈 ADD THIS

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY?.slice(0, 15) + "...");
console.log("OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY?.slice(0, 10) + "...");

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});