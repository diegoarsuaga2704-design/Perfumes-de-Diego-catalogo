import { getTemporada } from "../functions/temporada";

const DORADO = "#A47E3B";

function Murcielago({ className = "", style }) {
  return (
    <svg viewBox="0 0 120 44" className={className} style={style} fill={DORADO} aria-hidden="true">
      <path d="M54 20 C44 9 24 4 3 11 Q10 17 14 27 Q21 21 29 25 Q35 20 42 28 Q48 24 55 30 Z" />
      <path d="M66 20 C76 9 96 4 117 11 Q110 17 106 27 Q99 21 91 25 Q85 20 78 28 Q72 24 65 30 Z" />
      <ellipse cx="60" cy="25" rx="6" ry="9" />
      <circle cx="60" cy="15" r="4.6" />
      <path d="M56.2 13.5 L56.8 7 L59 11.5 Z M63.8 13.5 L63.2 7 L61 11.5 Z" />
    </svg>
  );
}

// Telaraña de esquina (esquina superior izquierda; se voltea para la derecha).
function Telarana({ className = "", style }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      style={style}
      fill="none"
      stroke={DORADO}
      strokeWidth="1.1"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M0 0 L120 0 M0 0 L112 42 M0 0 L86 86 M0 0 L42 112 M0 0 L0 120" />
      <path d="M24 0 Q22 7 22.4 8.4 Q17 13 16.5 16.5 Q12 17 8.4 22.4 Q5 22 0 24" />
      <path d="M50 0 Q46 13 46.8 17.5 Q38 25 34.4 34.4 Q25 38 17.5 46.8 Q12 46 0 50" />
      <path d="M78 0 Q72 20 73 27.3 Q60 39 53.7 53.7 Q39 60 27.3 73 Q20 72 0 78" />
      <path d="M106 0 Q98 28 99.3 37.2 Q82 53 73.1 73.1 Q53 82 37.2 99.3 Q28 98 0 106" />
    </svg>
  );
}

// Arañita colgando de su hilo.
function Arana({ className = "" }) {
  return (
    <svg viewBox="0 0 40 90" className={className} aria-hidden="true">
      <line x1="20" y1="0" x2="20" y2="62" stroke="#6b5a40" strokeWidth="0.8" strokeDasharray="2 2" />
      <g stroke="#3b2f20" strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M17 66 Q9 60 5 64 M17 68 Q8 67 4 72 M17 70 Q9 74 6 80 M18 72 Q12 79 11 85" />
        <path d="M23 66 Q31 60 35 64 M23 68 Q32 67 36 72 M23 70 Q31 74 34 80 M22 72 Q28 79 29 85" />
      </g>
      <ellipse cx="20" cy="65" rx="3.2" ry="3" fill="#3b2f20" />
      <ellipse cx="20" cy="71" rx="4.5" ry="5.2" fill="#3b2f20" />
    </svg>
  );
}

// Decoración de temporada para encabezados (portada y colección). Va dentro
// de un contenedor `relative`; no estorba clics. Animación muy suave que se
// apaga si el celular tiene "reducir movimiento".
export default function DecoracionTemporada() {
  const temporada = getTemporada();
  if (!temporada) return null;

  if (temporada === "muertos") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute left-3 top-2 text-lg opacity-60">🌼</span>
        <span className="absolute right-4 sm:right-[16%] top-2 text-xl opacity-60">🌼</span>
        <span className="hidden sm:block absolute left-[16%] bottom-1 text-sm opacity-40">🌼</span>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Telarana className="absolute left-0 top-0 w-16 sm:w-28 opacity-25" />
      <Telarana className="absolute right-0 top-0 w-16 sm:w-28 opacity-25" style={{ transform: "scaleX(-1)" }} />
      <Arana className="pdd-arana absolute right-8 sm:right-16 top-0 w-4 sm:w-5" />
      <Murcielago className="pdd-vuelo absolute right-[14%] sm:right-[22%] top-2 w-9 sm:w-12 opacity-50" />
      <Murcielago
        className="pdd-vuelo2 absolute right-[6%] sm:right-[17%] top-9 sm:top-10 w-5 sm:w-7 opacity-30"
        style={{ transform: "rotate(-12deg)" }}
      />
      <Murcielago
        className="hidden sm:block pdd-vuelo2 absolute left-[20%] top-4 w-7 opacity-25"
        style={{ transform: "rotate(10deg)" }}
      />
      <style>{`
        @keyframes pdd-flotar { 0%,100% { translate: 0 0; } 50% { translate: 0 -4px; } }
        @keyframes pdd-colgar { 0%,100% { rotate: -4deg; } 50% { rotate: 4deg; } }
        .pdd-vuelo { animation: pdd-flotar 4s ease-in-out infinite; }
        .pdd-vuelo2 { animation: pdd-flotar 5s ease-in-out infinite 1s; }
        .pdd-arana { transform-origin: top center; animation: pdd-colgar 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pdd-vuelo, .pdd-vuelo2, .pdd-arana { animation: none; }
        }
      `}</style>
    </div>
  );
}
