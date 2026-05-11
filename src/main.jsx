import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";
import App from "./App.jsx";
import { OrderProvider } from "./context/OrderContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ParfumsProvider } from "./context/ParfumsContext.jsx";
import ErrorBoundary from "./ui/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <OrderProvider>
          <CartProvider>
            <ParfumsProvider>
              <App />
              <Analytics />
            </ParfumsProvider>
          </CartProvider>
        </OrderProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);