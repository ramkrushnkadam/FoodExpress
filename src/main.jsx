import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <React.StrictMode>

        <ThemeProvider>

            <AuthProvider>

                <CartProvider>

                    <ToastProvider>

                        <App />

                    </ToastProvider>

                </CartProvider>

            </AuthProvider>

        </ThemeProvider>

    </React.StrictMode>
);