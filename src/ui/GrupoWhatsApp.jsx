import { FaWhatsapp } from "react-icons/fa";
import { track } from "@vercel/analytics";
import { GRUPO_WHATSAPP_URL } from "../functions/grupoWhatsApp";

const registrar = (lugar) => track("unirse_grupo_whatsapp", { lugar });

// Invitación al grupo de ventas de WhatsApp.
// variant="barra": franja verde de ancho completo (debajo del menú, en toda la tienda).
// variant="tarjeta": recuadro grande (portada).
export default function GrupoWhatsApp({ variant = "barra" }) {
  if (variant === "tarjeta") {
    return (
      <a
        href={GRUPO_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => registrar("portada")}
        className="block max-w-6xl mx-auto px-6"
      >
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 rounded-2xl bg-[#25D366] text-white px-4 py-4 sm:px-6 sm:py-6 shadow-lg hover:bg-[#1fb857] transition-colors">
          <FaWhatsapp className="shrink-0 w-10 h-10 sm:w-14 sm:h-14" />
          <div className="flex-1 min-w-0">
            <p className="text-lg sm:text-2xl font-extrabold leading-tight">
              Únete a mi grupo de ventas en WhatsApp
            </p>
            <p className="text-xs sm:text-base mt-1 text-white/90">
              Ahí publico todo lo que me va llegando: perfumes, decants y botellas.
            </p>
          </div>
          <span className="w-full sm:w-auto shrink-0 text-center bg-white text-[#128C7E] font-bold px-6 py-2.5 sm:py-3 rounded-full text-base">
            Unirme al grupo
          </span>
        </div>
      </a>
    );
  }

  return (
    <a
      href={GRUPO_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => registrar("barra")}
      className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fb857] text-white px-4 py-2.5 text-sm sm:text-base font-semibold transition-colors"
    >
      <FaWhatsapp className="shrink-0" size={20} />
      <span className="sm:hidden">Únete a mi grupo de WhatsApp</span>
      <span className="hidden sm:inline">
        Únete a mi grupo de WhatsApp: ahí publico todo lo que me llega
      </span>
      <span className="shrink-0 bg-white text-[#128C7E] font-bold text-xs sm:text-sm px-3 py-1 rounded-full">
        Unirme
      </span>
    </a>
  );
}
