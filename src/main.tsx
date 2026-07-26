import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, 
  // Session Replay
  replaysSessionSampleRate: import.meta.env.PROD ? 0.01 : 0.1, 
  replaysOnErrorSampleRate: import.meta.env.PROD ? 0.5 : 1.0, 
});
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
