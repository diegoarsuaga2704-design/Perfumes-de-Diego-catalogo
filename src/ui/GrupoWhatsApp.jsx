import { FaWhatsapp } from "react-icons/fa";
import { track } from "@vercel/analytics";
import { GRUPO_WHATSAPP_URL } from "../functions/grupoWhatsApp";

const registrar = (lugar) => track("unirse_grupo_whatsapp", { lugar });

// Invitación discreta al grupo de ventas de WhatsApp, en los colores de la marca.
// variant="barra": línea delgada debajo del menú (en toda la tienda).
// variant="linea": texto bajo el título de la portada.
export default function GrupoWhatsApp({ variant = "barra" }) {
  const enlace = (
    <a
      href={GRUPO_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => registrar(variant === "linea" ? "portada" : "barra")}
      className="inline-flex items-center gap-1.5 text-[#A47E3B] hover:text-[#8B6A30] hover:underline"
    >
      <FaWhatsapp className="shrink-0" size={14} />
      <span>
        Únete a mi grupo de WhatsApp
        <span className="hidden sm:inline text-gray-500">
          {" "}· ahí publico todo lo que me llega
        </span>{" "}
        →
      </span>
    </a>
  );

  if (variant === "linea") {
    return <p className="text-center text-sm -mt-2 mb-2 px-6">{enlace}</p>;
  }

  return (
    <div className="bg-[#FBF7F0] border-b border-[#A47E3B]/15 text-center text-xs sm:text-sm py-1.5 px-4">
      {enlace}
    </div>
  );
}
