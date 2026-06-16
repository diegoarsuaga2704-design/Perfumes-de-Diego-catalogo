import { useCart } from "../context/CartContext";
import { useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { detectInAppBrowser } from "../functions/detectInAppBrowser";
import { copiarTexto } from "../functions/copiarTexto";

const NUMERO = "5212212034647";
const NUMERO_VISIBLE = "+52 221 203 4647";
const MENSAJE = "Hola, quiero más información";

export default function WhatsAppFlotante() {
  const { isCartOpen } = useCart();
  const location = useLocation();

  const [inApp, setInApp] = useState({
    isInApp: false,
    platform: "android",
    source: null,
  });
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    setInApp(detectInAppBrowser());
  }, []);

  // Cerrar el panel al tocar fuera
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("touchstart", fuera);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("touchstart", fuera);
    };
  }, [abierto]);

  const enlaceWhatsApp = `https://wa.me/${NUMERO}?text=${encodeURIComponent(
    MENSAJE,
  )}`;

  if (isCartOpen) return null;

  // En ProductDetail (mobile) subimos el FAB para que no se tape con el
  // sticky CTA. En desktop queda en la posición de siempre.
  const enProductDetail = location.pathname.startsWith("/product/");
  const navTarget = inApp.platform === "ios" ? "Safari" : "Chrome";
  const puntos = inApp.platform === "ios" ? "(···)" : "(⋮)";

  const handleClick = () => {
    // Dentro de TikTok/Instagram el deep-link de WhatsApp suele bloquearse y
    // window.open no hace nada. En vez de fallar en silencio, abrimos un panel
    // con opciones que sí funcionan.
    if (inApp.isInApp) {
      setAbierto((v) => !v);
    } else {
      window.open(enlaceWhatsApp, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopiar = async () => {
    const ok = await copiarTexto(NUMERO_VISIBLE);
    if (!ok) return;
    setCopiado(true);
    setTimeout(() => setCopiado(false), 4000);
  };

  return (
    <div
      ref={cardRef}
      className={`fixed right-5 z-50 ${
        enProductDetail ? "bottom-24 sm:bottom-5" : "bottom-5"
      }`}
    >
      {inApp.isInApp && abierto && (
        <div className="absolute bottom-16 right-0 w-72 bg-white rounded-xl shadow-2xl border border-[#A47E3B]/40 p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900 mb-2">
            Escríbeme por WhatsApp
          </p>
          <p className="mb-3 leading-relaxed">
            Desde {inApp.source || "aquí"} a veces no abre solo. Ábreme en{" "}
            {navTarget} (toca {puntos} arriba → “Abrir en {navTarget}”) o copia
            mi número:
          </p>

          <a
            href={enlaceWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-[#25D366] text-white py-2 rounded-md font-medium mb-2"
          >
            Intentar abrir WhatsApp
          </a>

          <button
            type="button"
            onClick={handleCopiar}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-md font-medium transition-colors ${
              copiado
                ? "bg-green-600 text-white"
                : "border border-[#A47E3B] text-[#A47E3B] hover:bg-[#A47E3B]/10"
            }`}
          >
            {copiado ? "¡Número copiado!" : `Copiar ${NUMERO_VISIBLE}`}
          </button>
        </div>
      )}

      <button onClick={handleClick} aria-label="Abrir WhatsApp">
        <img
          src="https://xpxfacujdaiugphvpili.supabase.co/storage/v1/object/public/perfumsImages/whatsapp-logo.png"
          alt="WhatsApp"
          className="sm:w-14 w-12 rounded-full shadow-sm hover:scale-110 transition-transform hover:shadow-md"
        />
      </button>
    </div>
  );
}
