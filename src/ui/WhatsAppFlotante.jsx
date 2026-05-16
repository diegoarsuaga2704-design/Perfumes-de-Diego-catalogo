import { useCart } from "../context/CartContext";
import { useLocation } from "react-router-dom";

export default function WhatsAppFlotante() {
  const { isCartOpen } = useCart();
  const location = useLocation();

  const numero = "5212212034647";
  const mensaje = "Hola, quiero más información";

  const enlaceWhatsApp = `https://wa.me/${numero}?text=${encodeURIComponent(
    mensaje
  )}`;

  const handleClick = () => {
    window.open(enlaceWhatsApp, "_blank", "noopener,noreferrer");
  };

  if (isCartOpen) return null;

  // En ProductDetail (mobile) subimos el FAB para que no se tape con el
  // sticky CTA. En desktop queda en la posición de siempre.
  const enProductDetail = location.pathname.startsWith("/product/");

  return (
    <button
      onClick={handleClick}
      aria-label="Abrir WhatsApp"
      className={`fixed right-5 z-50 ${
        enProductDetail ? "bottom-24 sm:bottom-5" : "bottom-5"
      }`}
    >
      <img
        src="https://xpxfacujdaiugphvpili.supabase.co/storage/v1/object/public/perfumsImages/whatsapp-logo.png"
        alt="WhatsApp"
        className="sm:w-14 w-12 rounded-full shadow-sm hover:scale-110 transition-transform hover:shadow-md"
      />
    </button>
  );
}