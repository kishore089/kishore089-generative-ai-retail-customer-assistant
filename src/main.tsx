import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Activates Tailwind v4 + HeroUI styles + theme design tokens.
import "@/styles/theme.css";
// Importing the env module runs validateEnv() at startup, so a misconfigured
// environment halts the app with a descriptive error (Req 11.3).
import "@/config/env";
// Configure AWS Amplify (Cognito auth) before the app renders.
import "@/config/amplify";
import App from "@/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
