import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";
import App from "./App.jsx";
import { OrderProvider } from "./context/OrderContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <OrderProvider>
      <CartProvider>
        <App />
        <Analytics />
      </CartProvider>
    </OrderProvider>
  </StrictMode>
);