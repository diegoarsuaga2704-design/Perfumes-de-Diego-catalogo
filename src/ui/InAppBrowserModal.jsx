import { useEffect, useState } from "react";

function InAppBrowserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState("android");

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || "";

    // Detectar plataforma
    const esIOS = /iPad|iPhone|iPod/i.test(ua);
    setPlatform(esIOS ? "ios" : "android");

    // Detectar navegadores internos de TikTok, Instagram, Facebook
    const esInApp =
      /TikTok/i.test(ua) ||
      /musical_ly/i.test(ua) ||
      /BytedanceWebview/i.test(ua) ||
      /Instagram/i.test(ua) ||
      /FBAN|FBAV/i.test(ua);

    // Verificar si el usuario ya descartó el modal en esta sesión
    const yaDescartado = sessionStorage.getItem("inAppModalDismissed");

    if (esInApp && !yaDescartado) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem("inAppModalDismissed", "true");
  };

  if (!isOpen) return null;

  const instruccionesIOS = [
    "Toca los 3 puntitos (···) en la esquina superior derecha",
    "Selecciona 'Abrir en Navegador/Safari'",
    "¡Listo! Podrás comprar sin problemas",
  ];

  const instruccionesAndroid = [
    "Toca los 3 puntitos (⋮) en la esquina superior derecha",
    "Selecciona 'Abrir en Navegador'",
    "¡Listo! Podrás comprar sin problemas",
  ];

  const instrucciones =
    platform === "ios" ? instruccionesIOS : instruccionesAndroid;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in-modal">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-4 border-[#A47E3B] animate-shake">
        {/* Header dorado */}
        <div className="bg-gradient-to-r from-[#A47E3B] to-[#D4AF7A] text-white rounded-t-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-wide">
              IMPORTANTE
            </h2>
          </div>
          <p className="text-sm font-semibold">
            Para hacer tu pedido sigue los siguientes pasos
          </p>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <p className="text-gray-900 text-base font-semibold mb-2 text-center">
            Estás usando el navegador de TikTok
          </p>
          <p className="text-sm text-gray-700 mb-5 text-center leading-relaxed">
            para realizar tu pedido necesitas abrir el sitio en{" "}
            {platform === "ios" ? "Safari" : "Chrome"}.
          </p>

          {/* Instrucciones destacadas */}
          <div className="bg-amber-50 rounded-xl p-4 mb-5 border-2 border-amber-300">
            <p className="text-sm font-bold text-gray-900 mb-3 text-center">
              {platform === "ios"
                ? "📱 Cómo abrirlo en iPhone:"
                : "📱 Cómo abrirlo en Android:"}
            </p>
            <div className="space-y-3">
              {instrucciones.map((paso, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 bg-[#A47E3B] text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-800 leading-relaxed pt-0.5">
                    {paso}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Botón discreto para cerrar */}
          <button
            onClick={handleDismiss}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm"
          >
            Entendido, seguir aquí de todos modos
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
