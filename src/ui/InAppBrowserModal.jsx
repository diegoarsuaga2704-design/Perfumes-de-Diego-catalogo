import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

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
    "Selecciona 'Abrir en Safari' o 'Abrir en navegador'",
    "Podrás enviar tu pedido por WhatsApp sin problemas",
  ];

  const instruccionesAndroid = [
    "Toca los 3 puntitos (⋮) en la esquina superior derecha",
    "Selecciona 'Abrir en Chrome' o 'Abrir en navegador'",
    "Podrás enviar tu pedido por WhatsApp sin problemas",
  ];

  const instrucciones =
    platform === "ios" ? instruccionesIOS : instruccionesAndroid;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in-modal">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-100 p-2 rounded-full">
            <ExternalLink className="text-[#A47E3B]" size={24} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Abre en tu navegador
          </h2>
        </div>

        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
          Para enviar tu pedido por WhatsApp necesitas abrir este sitio en tu
          navegador. El navegador de TikTok no permite abrir WhatsApp
          directamente.
        </p>

        <div className="bg-amber-50 rounded-lg p-4 mb-5 border border-amber-200">
          <p className="text-xs font-semibold text-gray-800 mb-3">
            {platform === "ios" ? "📱 En iPhone:" : "📱 En Android:"}
          </p>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
            {instrucciones.map((paso, index) => (
              <li key={index} className="leading-relaxed">
                {paso}
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full bg-[#A47E3B] text-white py-3 rounded-lg font-semibold hover:bg-[#D4AF7A] transition-colors"
        >
          Entendido, seguir aquí
        </button>
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
