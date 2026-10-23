import { useState } from "react";
import { Send } from "lucide-react";
import { avisarTodo } from "../functions/avisarBing";

/**
 * Botón del admin: avisa a Bing (IndexNow) de todas las páginas del sitio.
 * Los perfumes y artículos ya avisan solos al guardarse; esto es para la
 * primera vez o después de cambios grandes.
 */
export default function IndexNowControl() {
  const [estado, setEstado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function handleClick() {
    setEnviando(true);
    setEstado(null);
    try {
      const r = await avisarTodo();
      if (r?.omitido) setEstado("Solo funciona en perfumesdediego.com.");
      else if (r?.ok) setEstado(`Listo: ${r.enviadas} páginas enviadas a Bing.`);
      else setEstado(`No se pudo enviar (código ${r?.status ?? "?"}).`);
    } catch {
      setEstado("No se pudo enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-1">Avisar a Bing</h3>
      <p className="text-sm text-gray-600 mb-4">
        Bing es el buscador que usa ChatGPT. Al guardar un perfume o un
        artículo se le avisa solo. Usa este botón la primera vez o después de
        cambios grandes en el catálogo.
      </p>
      <button
        onClick={handleClick}
        disabled={enviando}
        className="inline-flex items-center gap-2 bg-[#A47E3B] hover:bg-[#D4AF7A] text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
      >
        <Send size={16} />
        {enviando ? "Enviando..." : "Avisar de todo el sitio"}
      </button>
      {estado && <p className="text-sm text-gray-700 mt-3">{estado}</p>}
    </div>
  );
}
