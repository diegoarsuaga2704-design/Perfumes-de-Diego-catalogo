const MENSAJES = [
  "Envío GRATIS en decants desde $1,950",
  "Toda la perfumería nicho que buscas",
  "Prueba desde 1 ml antes de tu botella completa",
  "La mejor tienda para comprar tus perfumes y decants nicho",
  "Envíos a todo México",
];

import { getTemporada, TEXTOS_TEMPORADA } from "../functions/temporada";

function TopBanner() {
  // En temporada (Halloween / Día de Muertos) la barra pasa a modo noche:
  // fondo negro, texto dorado y mensajes de temporada intercalados.
  const temporada = getTemporada();
  const t = temporada ? TEXTOS_TEMPORADA[temporada] : null;
  const mensajes = t ? [t.banner[0], ...MENSAJES.slice(0, 2), t.banner[1], ...MENSAJES.slice(2)] : MENSAJES;
  // Repetimos los mensajes en DOS mitades idénticas: la animación recorre -50%
  // (una mitad), así el loop es continuo y sin saltos. 6 pasadas llenan
  // pantallas anchas para que nunca quede hueco.
  const secuencia = Array.from({ length: 6 }).flatMap(() => mensajes);

  return (
    <div
      className={`${t ? "bg-[#141014] text-[#D4AF7A]" : "bg-[#A47E3B] text-white"} text-[11px] sm:text-base py-2 sm:py-3 overflow-hidden`}
      style={t ? { borderBottom: `1px solid ${t.acento}55` } : undefined}
    >
      <div className="flex w-max pdd-marquee font-medium">
        {secuencia.map((m, i) => (
          <span key={i} className="flex items-center whitespace-nowrap">
            <span className="mx-6">{m}</span>
            <span className="opacity-70">•</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes pdd-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .pdd-marquee {
          animation: pdd-marquee 100s linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .pdd-marquee { animation: none; transform: none; }
        }
      `}</style>
    </div>
  );
}

export default TopBanner;
