import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SteelSignalDashboard } from "../app/components/SteelSignalDashboard";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("STEEL SIGNAL root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <SteelSignalDashboard />
  </StrictMode>,
);
