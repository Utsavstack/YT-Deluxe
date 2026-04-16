import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./utils/i18n";
import "./styles/tailwind.css";
import "./styles/index.css";

// Guard: stop calling pywebview bridge during page reload/unload
window.__ytdeluxe_unloading = false;
window.addEventListener('beforeunload', () => {
  window.__ytdeluxe_unloading = true;
});

// Intercept clipboard read to bypass pywebview Edge Chromium permission dialog
if (!navigator.clipboard) {
  navigator.clipboard = {};
}
const originalReadText = navigator.clipboard.readText;
navigator.clipboard.readText = async function() {
    // Block ALL bridge calls during reload/unload
    if (window.__ytdeluxe_unloading) return "";
    try {
        // Only call if pywebview bridge is FULLY initialized and stable
        if (window.pywebview
            && window.pywebview.api
            && window.pywebview.api.read_clipboard
            && window.pywebview._returnValuesCallbacks) {
            return await window.pywebview.api.read_clipboard();
        }
    } catch (e) {
        // Silently ignore
    }
    if (originalReadText) {
        try {
            return await originalReadText.bind(navigator.clipboard)();
        } catch (e) {
            // Clipboard access denied
        }
    }
    return "";
};

const container = document.getElementById("root");
const root = createRoot(container);

root.render(<App />);
