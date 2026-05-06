import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { AuthProvider } from "@/contexts/AuthContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);