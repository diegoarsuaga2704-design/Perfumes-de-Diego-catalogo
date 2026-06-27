const MENSAJES = [
  "Envío GRATIS en decants desde $1,950",
  "Prueba desde 1 ml antes de tu botella completa",
  "Envíos a todo México con DHL",
];

// Repetimos los mensajes en DOS mitades idénticas: la animación recorre -50%
// (una mitad), así el loop es continuo y sin saltos. 6 pasadas llenan pantallas
// anchas para que nunca quede hueco.
const SECUENCIA = Array.from({ length: 6 }).flatMap(() => MENSAJES);

function TopBanner() {
  return (
    <div className="bg-[#A47E3B] text-white text-[11px] sm:text-base py-2 sm:py-3 overflow-hidden">
      <div className="flex w-max pdd-marquee font-medium">
        {SECUENCIA.map((m, i) => (
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
          animation: pdd-marquee 30s linear infinite;
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
