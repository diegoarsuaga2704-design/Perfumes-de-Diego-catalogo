import { useCart } from "../context/CartContext";

export default function WhatsAppFlotante() {
  const { isCartOpen } = useCart();

  const numero = "5212212034647";
  const mensaje = "Hola, quiero más información";

  const enlaceWhatsApp = `https://wa.me/${numero}?text=${encodeURIComponent(
    mensaje
  )}`;

  const handleClick = () => {
    window.open(enlaceWhatsApp, "_blank", "noopener,noreferrer");
  };

  if (isCartOpen) return null;

  return (
    <button
      onClick={handleClick}
      aria-label="Abrir WhatsApp"
      className="fixed bottom-5 right-5 z-50"
    >
      <img
        src="https://xpxfacujdaiugphvpili.supabase.co/storage/v1/object/public/perfumsImages/whatsapp-logo.png"
        alt="WhatsApp"
        className="sm:w-14 w-12 rounded-full shadow-sm hover:scale-110 transition-transform hover:shadow-md"
      />
    </button>
  );
}