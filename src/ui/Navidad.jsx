import { useEffect, useRef, useState } from "react";

// Decoración de Navidad: nieve, guirnalda con foquitos, ramas de pino con
// esferas y moños. Todo es dibujo (SVG / canvas), sin emojis. Nada estorba
// los clics y las animaciones se apagan con "reducir movimiento".

export const ROJO = "#B3202A";
export const VERDE = "#1F5B3F";
export const VERDE_OSCURO = "#123B29";
export const DORADO = "#C9A24B";

const reduceMovimiento = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/* Nieve: copos dorados y blancos cayendo sobre toda la página.        */
/* ------------------------------------------------------------------ */

// Dibuja un copo de 6 brazos (con ramitas) en un canvas aparte, una sola vez
// por tamaño y color; luego cada copo solo se copia girado (más ligero).
function crearCopo(radio, color, contorno) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const lado = Math.ceil((radio + 2) * 2);
  const c = document.createElement("canvas");
  c.width = lado * dpr;
  c.height = lado * dpr;
  const g = c.getContext("2d");
  g.scale(dpr, dpr);
  g.translate(lado / 2, lado / 2);
  g.lineCap = "round";
  const brazos = (ancho, estilo) => {
    g.strokeStyle = estilo;
    g.lineWidth = ancho;
    for (let i = 0; i < 6; i++) {
      g.save();
      g.rotate((Math.PI / 3) * i);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(0, -radio);
      // ramitas en "V" a media altura y cerca de la punta
      for (const [p, l] of [[0.45, 0.32], [0.72, 0.22]]) {
        g.moveTo(0, -radio * p);
        g.lineTo(-radio * l, -radio * (p + l * 0.9));
        g.moveTo(0, -radio * p);
        g.lineTo(radio * l, -radio * (p + l * 0.9));
      }
      g.stroke();
      g.restore();
    }
  };
  if (contorno) brazos(2.4, contorno); // halo para que se vea sobre fondo claro
  brazos(1.1, color);
  return { canvas: c, lado };
}

export function Nieve() {
  const ref = useRef(null);

  useEffect(() => {
    if (reduceMovimiento()) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    let ancho = 0;
    let alto = 0;
    let copos = [];
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Copos ya dibujados: 3 tamaños × 2 colores.
    const TAMANOS = [3.5, 5, 6.5];
    const modelos = TAMANOS.flatMap((r) => [
      { r, ...crearCopo(r, "rgba(201,162,75,0.9)") },
      { r, ...crearCopo(r, "rgba(255,255,255,0.95)", "rgba(120,120,120,0.22)") },
    ]);

    const nuevoCopo = (arriba) => {
      const modelo = modelos[Math.floor(Math.random() * modelos.length)];
      return {
        x: Math.random() * ancho,
        y: arriba ? -10 - Math.random() * alto : Math.random() * alto,
        modelo,
        // velocidades por segundo (igual en pantallas de 60 o 120 Hz)
        vy: (0.22 + modelo.r * 0.05 + Math.random() * 0.2) * 60,
        fase: Math.random() * Math.PI * 2,
        amp: (0.2 + Math.random() * 0.45) * 60,
        giro: Math.random() * Math.PI,
        vgiro: (Math.random() - 0.5) * 0.012 * 60,
        alfa: 0.6 + Math.random() * 0.4,
      };
    };

    // Al cambiar el tamaño (en celular pasa varias veces al cargar, cuando se
    // esconde la barra del navegador) solo se ajusta el lienzo: los copos se
    // quedan donde van, no se vuelven a repartir.
    const medir = () => {
      const anchoPrevio = ancho;
      ancho = window.innerWidth;
      alto = window.innerHeight;
      canvas.width = ancho * dpr;
      canvas.height = alto * dpr;
      canvas.style.width = `${ancho}px`;
      canvas.style.height = `${alto}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cantidad = ancho < 640 ? 26 : 60;
      if (anchoPrevio && anchoPrevio !== ancho) {
        for (const c of copos) c.x = (c.x / anchoPrevio) * ancho;
      }
      const primeraVez = copos.length === 0;
      while (copos.length < cantidad) copos.push(nuevoCopo(!primeraVez));
      copos.length = cantidad;
    };

    let ultimo = 0;
    const dibujar = (ahora) => {
      // segundos desde el cuadro anterior; tope para que no "brinquen" si el
      // navegador se atora mientras carga la página
      const dt = ultimo ? Math.min((ahora - ultimo) / 1000, 1 / 30) : 1 / 60;
      ultimo = ahora;
      ctx.clearRect(0, 0, ancho, alto);
      for (const c of copos) {
        c.fase += 0.72 * dt;
        c.y += c.vy * dt;
        c.x += Math.sin(c.fase) * c.amp * dt;
        if (c.y > alto + 10) Object.assign(c, nuevoCopo(true), { y: -10 });
        if (c.x > ancho + 10) c.x = -10;
        if (c.x < -10) c.x = ancho + 10;

        c.giro += c.vgiro * dt;
        const { canvas: img, lado } = c.modelo;
        ctx.save();
        ctx.globalAlpha = c.alfa;
        ctx.translate(c.x, c.y);
        ctx.rotate(c.giro);
        ctx.drawImage(img, -lado / 2, -lado / 2, lado, lado);
        ctx.restore();
      }
      raf = requestAnimationFrame(dibujar);
    };

    const alCambiarVisibilidad = () => {
      cancelAnimationFrame(raf);
      ultimo = 0;
      if (!document.hidden) raf = requestAnimationFrame(dibujar);
    };

    medir();
    raf = requestAnimationFrame(dibujar);
    // aparece poco a poco en lugar de golpe
    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });
    window.addEventListener("resize", medir);
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", medir);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20"
      style={{ opacity: 0, transition: "opacity 1.5s ease-out" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Guirnalda de pino con foquitos que parpadean (bajo el menú).        */
/* ------------------------------------------------------------------ */
const COLORES_FOCO = [ROJO, DORADO, "#2E8B57", "#F4EBD0"];
const TONOS_PINO = [VERDE_OSCURO, VERDE, "#2E6B4A", "#174A33"];

// Número "aleatorio" fijo (mismo dibujo en cada render).
const rnd = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// Agujas de pino alrededor de una curva. `punto(t)` da {x, y} para t de 0 a 1.
function agujasPino(punto, cantidad, largo, semilla = 0) {
  const trazos = [];
  for (let i = 0; i <= cantidad; i++) {
    const { x, y } = punto(i / cantidad);
    for (let k = 0; k < 4; k++) {
      const n = semilla + i * 4 + k;
      const ang = rnd(n) * Math.PI * 2;
      const l = largo * (0.6 + rnd(n + 99) * 0.6);
      trazos.push(
        <line
          key={`${i}-${k}`}
          x1={x}
          y1={y}
          x2={x + Math.cos(ang) * l}
          y2={y + Math.sin(ang) * l}
          stroke={TONOS_PINO[n % TONOS_PINO.length]}
        />,
      );
    }
  }
  return trazos;
}
const TRAMO = 140; // ancho de cada tramo de guirnalda en px

function TramoGuirnalda({ indice }) {
  // Curva del tramo: cuelga hacia abajo en el centro.
  const y = (t) => 6 + Math.sin(Math.PI * t) * 9;
  const agujas = agujasPino((t) => ({ x: t * TRAMO, y: y(t) }), 46, 7, indice * 500);
  const focos = [0.16, 0.38, 0.62, 0.84].map((t, j) => {
    const x = t * TRAMO;
    const cy = y(t);
    const color = COLORES_FOCO[(indice + j) % COLORES_FOCO.length];
    const retraso = ((indice * 4 + j) % 7) * 0.35;
    return (
      <g key={j} transform={`translate(${x} ${cy + 2})`}>
        <rect x="-2" y="0" width="4" height="3.5" rx="0.8" fill="#4a4a4a" />
        <ellipse
          cx="0"
          cy="8"
          rx="3.6"
          ry="5"
          fill={color}
          className="pdd-foco"
          style={{ animationDelay: `${retraso}s`, color }}
        />
        <ellipse cx="-1.1" cy="6.3" rx="0.9" ry="1.6" fill="#fff" opacity="0.55" />
      </g>
    );
  });

  return (
    <svg
      width={TRAMO}
      height="32"
      viewBox={`0 0 ${TRAMO} 32`}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <g strokeWidth="1.5" strokeLinecap="round">{agujas}</g>
      {/* Hilo dorado */}
      <path
        d={`M0 9 Q${TRAMO / 2} ${9 + 20} ${TRAMO} 9`}
        stroke={DORADO}
        strokeWidth="1.2"
        strokeDasharray="1 3"
        fill="none"
        opacity="0.9"
      />
      {focos}
    </svg>
  );
}

export function Guirnalda() {
  const [tramos, setTramos] = useState(12);
  useEffect(() => {
    const medir = () => setTramos(Math.ceil(window.innerWidth / TRAMO) + 1);
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative flex h-[22px] bg-gray-200 overflow-x-clip overflow-y-visible"
    >
      {Array.from({ length: tramos }, (_, i) => (
        <TramoGuirnalda key={i} indice={i} />
      ))}
      <style>{`
        @keyframes pdd-foco {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 4px currentColor); }
          50% { opacity: 0.45; filter: none; }
        }
        .pdd-foco { animation: pdd-foco 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .pdd-foco { animation: none; } }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rama de pino con esferas colgando (esquinas de la portada).         */
/* ------------------------------------------------------------------ */
function Esfera({ x, hilo, r, color, retraso = 0 }) {
  const id = `esfera-${color.replace("#", "")}-${r}`;
  return (
    <g
      className="pdd-esfera"
      style={{ transformOrigin: `${x}px 0px`, animationDelay: `${retraso}s` }}
    >
      <defs>
        <radialGradient id={id} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="25%" stopColor={color} />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <line x1={x} y1="0" x2={x} y2={hilo} stroke={DORADO} strokeWidth="1" />
      <rect x={x - r * 0.3} y={hilo} width={r * 0.6} height={r * 0.35} rx="1" fill={DORADO} />
      <circle cx={x} cy={hilo + r * 0.35 + r} r={r} fill={color} />
      <circle cx={x} cy={hilo + r * 0.35 + r} r={r} fill={`url(#${id})`} />
      <path
        d={`M${x - r} ${hilo + r * 1.35} Q${x} ${hilo + r * 1.75} ${x + r} ${hilo + r * 1.35}`}
        stroke={DORADO}
        strokeWidth="1.2"
        fill="none"
        opacity="0.8"
      />
    </g>
  );
}

export function RamaPino({ className = "", espejo = false }) {
  // Tallo curvo desde la esquina con ramitas; agujas alrededor.
  const tallo = (t) => ({ x: 4 + t * 230, y: 8 + Math.sin(t * Math.PI * 0.9) * 26 });
  const agujas = [
    ...agujasPino(tallo, 70, 15, 7),
    ...agujasPino((t) => ({ x: 70 + t * 40, y: 30 + t * 22 }), 18, 11, 300),
    ...agujasPino((t) => ({ x: 150 + t * 38, y: 34 - t * 20 }), 18, 11, 600),
  ];
  return (
    <svg
      viewBox="0 0 250 150"
      className={className}
      style={espejo ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
    >
      <path d="M4 8 Q120 60 234 30" stroke="#5b4027" strokeWidth="3" fill="none" />
      <g strokeWidth="2.2" strokeLinecap="round">{agujas}</g>
      <g transform="translate(0 40)">
        <Esfera x={60} hilo={22} r={11} color={ROJO} retraso={0} />
        <Esfera x={118} hilo={44} r={14} color={DORADO} retraso={0.8} />
        <Esfera x={176} hilo={18} r={10} color={VERDE} retraso={1.6} />
      </g>
      {/* Moño */}
      <g transform="translate(26 18)">
        <path d="M0 0 C-14 -12 -18 6 0 2 Z" fill={ROJO} />
        <path d="M0 0 C14 -12 18 6 0 2 Z" fill={ROJO} />
        <path d="M-1 2 L-7 18 L-2 15 L0 20 Z M1 2 L7 18 L2 15 L0 20 Z" fill="#8E1820" />
        <circle cx="0" cy="1" r="3" fill="#8E1820" />
      </g>
      <style>{`
        @keyframes pdd-esfera { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        .pdd-esfera { animation: pdd-esfera 4.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .pdd-esfera { animation: none; } }
      `}</style>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Moño de regalo para la esquina de las tarjetas de la portada.       */
/* ------------------------------------------------------------------ */
export function MonoRegalo({ className = "" }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      {/* Listón en diagonal por la esquina */}
      <path d="M0 52 L52 0 L74 0 L0 74 Z" fill={ROJO} />
      <path d="M0 52 L52 0" stroke={DORADO} strokeWidth="1.5" />
      <path d="M0 74 L74 0" stroke={DORADO} strokeWidth="1.5" />
      {/* Moño */}
      <g transform="translate(32 32) rotate(45)">
        <path d="M-2 4 L-12 34 L-4 29 L0 38 Z M2 4 L12 34 L4 29 L0 38 Z" fill="#8E1820" />
        <path d="M0 0 C-34 -26 -40 18 0 5 Z" fill={ROJO} stroke="#8E1820" strokeWidth="1.2" />
        <path d="M0 0 C34 -26 40 18 0 5 Z" fill={ROJO} stroke="#8E1820" strokeWidth="1.2" />
        <path d="M-6 -1 C-18 -10 -22 2 -8 2" stroke="#E56A72" strokeWidth="1.2" fill="none" />
        <circle cx="0" cy="2" r="6.5" fill="#8E1820" stroke={DORADO} strokeWidth="1.2" />
      </g>
    </svg>
  );
}
