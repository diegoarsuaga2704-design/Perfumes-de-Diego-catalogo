import { normalizarTexto } from "./normalizarTexto";

// Decant y botella del mismo perfume: mismo nombre y misma casa (sin importar
// mayúsculas, acentos, espacios ni signos: "Torino 22" = "Torino22"). Si los
// dos tienen concentración y es distinta (p. ej. EDP vs Extrait), no se
// consideran el mismo.
// "Eau de Parfum" = "EDP", "Eau de Toilette" = "EDT", "Extrait de Parfum" =
// "Extrait", tanto en el nombre como en la concentración.
const clave = (v) =>
  normalizarTexto(v)
    .replace(/[^a-z0-9]/g, "")
    .replace(/eaudeparfum/g, "edp")
    .replace(/eaudetoilette/g, "edt")
    .replace(/extraitdeparfum/g, "extrait");

export function esMismoPerfume(a, b) {
  if (!a || !b || a.id === b.id) return false;
  if (clave(a.nombre) !== clave(b.nombre) || clave(a.casa) !== clave(b.casa)) return false;
  if (a.concentracion && b.concentracion && clave(a.concentracion) !== clave(b.concentracion)) {
    return false;
  }
  return true;
}

// Versiones del otro formato (botellas si es decant, decants si es botella)
// que estén Disponibles o Próximamente. Agotadas no. Primero las disponibles.
export function otrosFormatosDisponibles(parfum, todos = []) {
  const orden = { Disponible: 0, Próximamente: 1 };
  return todos
    .filter(
      (p) =>
        esMismoPerfume(parfum, p) &&
        p.stock !== parfum.stock &&
        (p.disponible === "Disponible" || p.disponible === "Próximamente"),
    )
    .sort(
      (a, b) =>
        orden[a.disponible] - orden[b.disponible] ||
        (Number(a.precio) || 0) - (Number(b.precio) || 0),
    );
}

// Prioridad para elegir qué fila representa al perfume en el catálogo:
// primero disponible, luego próximamente; a igualdad, el decant.
const prioridad = (p) =>
  ({ Disponible: 0, Próximamente: 1 })[p.disponible] ?? 2;

/**
 * Disponibilidad del perfume en conjunto (decant + botella): "Disponible" si
 * alguna versión lo está; si no, "Próximamente" si alguna lo está; si no, la
 * de la propia fila.
 */
export function estadoGrupo(parfum, todos = []) {
  if (!parfum) return "";
  const versiones = [parfum, ...todos.filter((p) => esMismoPerfume(parfum, p))];
  const mejor = versiones.reduce((a, b) => (prioridad(b) < prioridad(a) ? b : a));
  return mejor.disponible;
}

/**
 * Junta en una sola tarjeta el decant y la botella del mismo perfume.
 * Respeta el orden de la lista (la tarjeta queda donde aparece el primero)
 * y agrega `formatos: { decant, botella }` para mostrarlo en la tarjeta.
 */
export function agruparFormatos(lista = []) {
  const grupos = [];
  for (const p of lista) {
    const g = grupos.find((x) => x.filas.some((f) => esMismoPerfume(f, p)));
    if (g) g.filas.push(p);
    else grupos.push({ filas: [p] });
  }
  return grupos.map(({ filas }) => {
    const rep = [...filas].sort(
      (a, b) =>
        prioridad(a) - prioridad(b) ||
        Number(a.stock === true) - Number(b.stock === true),
    )[0];
    return {
      ...rep,
      formatos: {
        decant: filas.some((f) => f.stock !== true),
        botella: filas.some((f) => f.stock === true),
      },
    };
  });
}

// Distancia de edición (cuántas letras hay que cambiar para igualar dos textos).
function distancia(a, b) {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return fila[b.length];
}

const parecido = (x, y) => {
  if (x === y) return true;
  if (!x || !y) return false;
  const corto = x.length < y.length ? x : y;
  const largo = corto === x ? y : x;
  if (corto.length >= 5 && largo.includes(corto)) return true; // "torino22" ⊂ "torino22xerjoff"
  return corto.length >= 5 && distancia(x, y) <= 2; // errores de dedo
};

// Posiblemente el mismo perfume pero escrito distinto (nombre, casa o
// concentración no coinciden del todo). Sirve para proponer vincularlos.
export function posibleMismo(a, b) {
  if (!a || !b || a.id === b.id || esMismoPerfume(a, b)) return false;
  return parecido(clave(a.nombre), clave(b.nombre)) && parecido(clave(a.casa), clave(b.casa));
}
