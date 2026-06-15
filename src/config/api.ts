import { env } from "@/env";
// Use a relative URL so cookie-sync requests go through the Vite dev proxy
// (/api -> http://localhost:5000) rather than making direct cross-origin
// requests to a hardcoded port that may not be running.
export const API_BASE_URL = env.VITE_API_URL || "";
