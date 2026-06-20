import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { detectInAppBrowser } from "../functions/detectInAppBrowser";

function InAppBrowserModal() {
  const { cartItems, closeCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState("android");
  const [source, setSource] = useState(null);
  const [isInApp, setIsInApp] = useState(false);

  // Detectar in-app browser una sola vez al montar.
  useEffect(() => {
    const {
      isInApp: detectedInApp,
      platform: detectedPlatform,
      source: detectedSource,
    } = detectInAppBrowser();
    setIsInApp(detectedInApp);
    setPlatform(detectedPlatform);
    setSource(detectedSource);
  }, []);

  // Disparar el modal cuando el cliente tiene al menos un producto en el carrito
  // y está en un navegador in-app y no descartó el modal en esta sesión.
  // Al abrirlo, cerramos el carrito para que no quede superpuesto.
  useEffect(() => {
    if (!isInApp) return;
    if (cartItems.length === 0) return;

    const yaDescartado = sessionStorage.getItem("inAppModalDismissed");
    if (yaDescartado) return;

    setIsOpen(true);
    closeCart();
  }, [isInApp, cartItems.length]);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem("inAppModalDismissed", "true");
  };

  if (!isOpen) return null;

  const navegadorObjetivo = platform === "ios" ? "Safari" : "Chrome";
  const puntos = platform === "ios" ? "(···)" : "(⋮)";

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in-modal">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
        {/* Header dorado, tono amable */}
        <div className="bg-gradient-to-r from-[#A47E3B] to-[#D4AF7A] text-white p-4 text-center">
          <h2 className="text-lg sm:text-xl font-bold mb-1">
            Para enviarme tu pedido 💬
          </h2>
          <p className="text-sm font-medium text-white/90">
            Estás viendo el sitio dentro de {source || "una app"}
          </p>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            Tranquilo, puedes terminar tu pedido{" "}
            <strong>sin salir de aquí</strong>. Cuando llegues al carrito, usa{" "}
            <strong>“Copiar mi pedido”</strong> y mándamelo por WhatsApp — así no
            pierdes nada de lo que llevas.
          </p>

          <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
            <p className="text-sm text-gray-800 leading-relaxed">
              <strong>¿Prefieres abrirlo en {navegadorObjetivo}?</strong> Toca los
              3 puntitos {puntos} arriba a la derecha → “Abrir en{" "}
              {navegadorObjetivo}”. Ojo: ahí tu carrito se queda en{" "}
              {source || "esta app"}.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full bg-[#A47E3B] text-white py-3 rounded-lg font-semibold hover:bg-[#8B6A30] transition-colors text-sm"
          >
            Entendido
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes fade-in-modal {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in-modal {
            animation: fade-in-modal 0.2s ease-out;
          }
        `}
      </style>
    </div>
  );
}

export default InAppBrowserModal;
