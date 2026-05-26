import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";  // 👈 ADD THIS

app.use("/api", authRoutes);
app.use("/api", chatRoutes); 
app.use("/api/match", matchRoutes); // 👈 ADD THIS