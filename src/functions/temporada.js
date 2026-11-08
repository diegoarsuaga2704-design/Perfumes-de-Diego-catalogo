import { normalizarTexto } from "./normalizarTexto";

// Temporadas decorativas de la tienda. Se encienden y apagan solas por fecha
// (hora de México) y se repiten cada año:
//   halloween: 20 al 31 de octubre
//   muertos:   1 y 2 de noviembre
//   navidad:   7 de noviembre al 6 de enero (Día de Reyes)
// Para previsualizar en cualquier fecha:
//   ?temporada=halloween | muertos | navidad | ninguna
// (se recuerda en la pestaña).
const KEY = "temporada_preview";

export function getTemporada(fecha = new Date()) {
  try {
    const q = new URLSearchParams(window.location.search).get("temporada");
    if (q) sessionStorage.setItem(KEY, q);
    const p = sessionStorage.getItem(KEY);
    if (p === "halloween" || p === "muertos" || p === "navidad") return p;
    if (p === "ninguna") return null;
  } catch {
    // sin window/sessionStorage
  }
  const mx = new Date(fecha.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const mes = mx.getMonth() + 1;
  const dia = mx.getDate();
  if (mes === 10 && dia >= 20) return "halloween";
  if (mes === 11 && dia <= 2) return "muertos";
  if ((mes === 11 && dia >= 7) || mes === 12 || (mes === 1 && dia <= 6)) return "navidad";
  return null;
}

export const TEXTOS_TEMPORADA = {
  halloween: {
    titulo: "Perfumes para Halloween",
    corto: "Halloween 🎃",
    subtitulo: "Aromas oscuros para la noche más larga: oud, cuero, incienso, ahumados, especias y vainillas.",
    banner: ["🎃 Temporada de perfumes oscuros", "🦇 Aromas para la noche más larga"],
    acento: "#E8772E", // naranja calabaza
  },
  muertos: {
    titulo: "Aromas para Día de Muertos",
    corto: "Día de Muertos 🌼",
    subtitulo: "Aromas cálidos para recordar: incienso, resinas, especias, ámbar y vainilla.",
    banner: ["🌼 Aromas para recordar", "🕯️ Día de Muertos en Perfumes de Diego"],
    acento: "#F2A007", // cempasúchil
  },
  navidad: {
    titulo: "Regalos de Navidad",
    corto: "Navidad",
    subtitulo: "Perfumes para regalar (o regalarte): cálidos, especiados, gourmand y elegantes.",
    banner: [
      "Regala perfume esta Navidad",
      "Haz tu pedido con anticipación para recibirlo antes del 24",
    ],
    acento: "#B3202A", // rojo navidad
  },
};

// Notas que definen la colección de temporada (sin acentos, en minúsculas).
const NOTAS_NAVIDAD = [
  "canela", "clavo", "jengibre", "nuez moscada", "cardamomo", "vainilla",
  "tonka", "ambar", "pino", "abeto", "cedro", "incienso", "mirra", "naranja",
  "mandarina", "chocolate", "cacao", "praline", "almendra", "castana",
  "caramelo", "miel", "ron", "cognac", "coñac", "licor",
];
const NOTAS_OSCURAS = [
  "oud", "agar", "cuero", "incienso", "ahumad", "humo", "tabaco", "vainilla",
  "especia", "canela", "clavo", "cardamomo", "pimienta", "licor", "alicorad",
  "ron", "whisky", "cognac", "coñac", "cafe", "chocolate", "cacao", "mirra",
  "resina", "pachuli", "ambar", "labdano", "benjui", "tonka", "calabaza", "copal",
];

// Cuántas notas "oscuras" tiene un perfume (0 = no entra a la colección).
export function puntajeTemporada(parfum, temporada = "halloween") {
  const notas = normalizarTexto(parfum?.notas);
  const lista = temporada === "navidad" ? NOTAS_NAVIDAD : NOTAS_OSCURAS;
  return lista.reduce((n, k) => n + (notas.includes(normalizarTexto(k)) ? 1 : 0), 0);
}

// Casas de la colección de temporada (basta con que el nombre de la casa
// contenga el texto). "fijas": entran todos sus perfumes disponibles.
// "relleno": completan los lugares que falten, alternando entre casas.
export const CASAS_COLECCION = {
  fijas: ["benneviento", "toskovat"],
  relleno: ["filippo", "ensar oud"],
};

export const esDeCasa = (parfum, casa) => normalizarTexto(parfum?.casa).includes(casa);
