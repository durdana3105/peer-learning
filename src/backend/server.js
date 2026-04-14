import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";  // 👈 ADD THIS

app.use("/api", authRoutes);
app.use("/api", chatRoutes); // 👈 ADD THIS