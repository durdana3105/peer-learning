import "dotenv/config";
import app from "./app.js";
import { validateEnv } from "./utils/env.js";

const env = validateEnv(); // Immediately crash if required envs are missing
const PORT = env.PORT || 5000;

console.log("Backend server initialized");

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
