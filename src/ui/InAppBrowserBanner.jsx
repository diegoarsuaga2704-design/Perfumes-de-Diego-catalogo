import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";

function InAppBrowserBanner() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);
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

    // Verificar si el usuario ya descartó el banner en esta sesión
    const yaDescartado = sessionStorage.getItem("inAppBannerDismissed");

    if (esInApp && !yaDescartado) {
      setIsInAppBrowser(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("inAppBannerDismissed", "true");
  };

  if (!isInAppBrowser || dismissed) return null;

  const instruccionesIOS = [
    "Toca los 3 puntitos (···) en la esquina superior derecha",
    "Selecciona 'Abrir en Safari' o 'Abrir en navegador'",
    "Listo, podrás enviar tu pedido por WhatsApp",
  ];

  const instruccionesAndroid = [
    "Toca los 3 puntitos (⋮) en la esquina superior derecha",
    "Selecciona 'Abrir en Chrome' o 'Abrir en navegador'",
    "Listo, podrás enviar tu pedido por WhatsApp",
  ];

  const instrucciones =
    platform === "ios" ? instruccionesIOS : instruccionesAndroid;

  return (
    <div className="bg-amber-50 border-b-2 border-amber-300 text-gray-800 relative">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3 pr-8">
          <ExternalLink
            className="text-[#A47E3B] flex-shrink-0 mt-0.5"
            size={18}
          />
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1">
              Para enviar tu pedido por WhatsApp, abre este sitio en tu
              navegador
            </p>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-xs text-[#A47E3B] underline font-medium hover:text-[#D4AF7A]"
            >
              {showInstructions ? "Ocultar instrucciones" : "Ver cómo hacerlo"}
            </button>

            {showInstructions && (
              <div className="mt-3 bg-white rounded-md p-3 border border-amber-200">
                <p className="text-xs font-semibold text-gray-800 mb-2">
                  {platform === "ios" ? "📱 iPhone:" : "📱 Android:"}
                </p>
                <ol className="text-xs text-gray-700 space-y-1 list-decimal pl-4">
                  {instrucciones.map((paso, index) => (
                    <li key={index}>{paso}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 p-1"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default InAppBrowserBanner;
