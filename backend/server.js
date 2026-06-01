import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";

dotenv.config(); // must be first
const PORT = process.env.PORT || 5000;

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((error) => {
      console.error("MongoDB connection failed");
    });
} else {
  console.warn("MONGO_URI is not configured; auth routes will fail until it is set.");
}

console.log("Backend server initialized");

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});