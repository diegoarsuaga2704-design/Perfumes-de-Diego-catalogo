import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { detectInAppBrowser } from "../functions/detectInAppBrowser";
import { copiarTexto } from "../functions/copiarTexto";

const NUMERO_VISIBLE = "+52 221 203 4647";

function CTAWhatsApp({
  titulo = "¿No sabes cuál elegir?",
  mensaje = "Cuéntame qué notas o estilo te gustan y te armo una recomendación personalizada.",
  whatsappText = "Hola Diego, necesito ayuda para elegir un perfume",
}) {
  const whatsappUrl = `https://wa.me/5212212034647?text=${encodeURIComponent(
    whatsappText,
  )}`;

  const [inApp, setInApp] = useState({
    isInApp: false,
    platform: "android",
    source: null,
  });
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setInApp(detectInAppBrowser());
  }, []);

  const navTarget = inApp.platform === "ios" ? "Safari" : "Chrome";
  const puntos = inApp.platform === "ios" ? "(···)" : "(⋮)";

  const handleCopiar = async () => {
    const ok = await copiarTexto(NUMERO_VISIBLE);
    if (!ok) return;
    setCopiado(true);
    setTimeout(() => setCopiado(false), 4000);
  };

  return (
    <section className="bg-gradient-to-br from-[#A47E3B] to-[#D4AF7A] py-12 sm:py-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-white text-2xl sm:text-3xl font-extrabold mb-3">
          {titulo}
        </h2>
        <p className="text-white/90 text-sm sm:text-base mb-6 leading-relaxed max-w-xl mx-auto">
          {mensaje}
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-[#A47E3B] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 active:bg-gray-200 transition-all duration-300 hover:scale-105 shadow-lg"
        >
          <MessageCircle size={20} />
          Escríbeme por WhatsApp
        </a>

        {inApp.isInApp && (
          <div className="mt-5 text-white/90 text-sm max-w-md mx-auto">
            <p className="mb-2 leading-relaxed">
              ¿No se abrió? Desde {inApp.source || "aquí"} ábreme en {navTarget}{" "}
              (toca {puntos} arriba → “Abrir en {navTarget}”) o copia mi número:
            </p>
            <button
              type="button"
              onClick={handleCopiar}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                copiado
                  ? "bg-green-600 text-white"
                  : "bg-white/15 text-white border border-white/50 hover:bg-white/25"
              }`}
            >
              {copiado ? "¡Número copiado!" : `Copiar ${NUMERO_VISIBLE}`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default CTAWhatsApp;
