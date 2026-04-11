import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./utils/i18n";
import "./styles/tailwind.css";
import "./styles/index.css";

// Intercept clipboard read to bypass pywebview Edge Chromium permission dialog
if (!navigator.clipboard) {
  navigator.clipboard = {};
}
const originalReadText = navigator.clipboard.readText;
navigator.clipboard.readText = async function() {
    if (window.pywebview && window.pywebview.api) {
        try {
            return await window.pywebview.api.read_clipboard();
        } catch (e) {
            console.error("Pywebview API clipboard read failed:", e);
        }
    }
    if (originalReadText) {
        return originalReadText.bind(navigator.clipboard)();
    }
    return "";
};

const container = document.getElementById("root");
const root = createRoot(container);

root.render(<App />);
