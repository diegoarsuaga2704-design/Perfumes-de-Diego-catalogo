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

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in-modal">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-4 border-[#A47E3B] animate-shake">
        {/* Header dorado */}
        <div className="bg-gradient-to-r from-[#A47E3B] to-[#D4AF7A] text-white rounded-t-xl p-4 text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-wide mb-1">
            IMPORTANTE
          </h2>
          <p className="text-sm font-semibold">
            Para realizar tu pedido tienes que abrir el sitio en {navegadorObjetivo}
          </p>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4 text-center leading-relaxed">
            Estás viendo el sitio dentro de {source || "una app"}, y desde aquí
            no se puede abrir WhatsApp para enviar tu pedido.
          </p>

          {/* Instrucciones */}
          <div className="bg-amber-50 rounded-xl p-4 mb-4 border-2 border-amber-300">
            <p className="text-sm font-bold text-gray-900 mb-2">Cómo abrirlo:</p>
            <ol className="space-y-1.5 list-decimal pl-5 text-sm text-gray-800">
              <li>Toca los 3 puntitos {platform === "ios" ? "(···)" : "(⋮)"} arriba a la derecha</li>
              <li>Selecciona "Abrir en {navegadorObjetivo}"</li>
            </ol>
          </div>

          {/* Aviso del carrito */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-md p-3 mb-4 text-xs text-gray-700">
            <p>
              <strong>Nota:</strong> tu carrito puede vaciarse al cambiar de
              navegador. Si pasa, son solo unos clicks volver a armarlo.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
          >
            Sigo aquí por ahora
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

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
          }
          .animate-shake {
            animation: shake 0.4s ease-in-out;
          }
        `}
      </style>
    </div>
  );
}

export default InAppBrowserModal;