import { normalizarTexto } from "./normalizarTexto";

// Decant y botella del mismo perfume: mismo nombre y misma casa (sin importar
// mayúsculas, acentos, espacios ni signos: "Torino 22" = "Torino22"). Si los
// dos tienen concentración y es distinta (p. ej. EDP vs Extrait), no se
// consideran el mismo.
const clave = (v) => normalizarTexto(v).replace(/[^a-z0-9]/g, "");

export function esMismoPerfume(a, b) {
  if (!a || !b || a.id === b.id) return false;
  if (clave(a.nombre) !== clave(b.nombre) || clave(a.casa) !== clave(b.casa)) return false;
  if (a.concentracion && b.concentracion && clave(a.concentracion) !== clave(b.concentracion)) {
    return false;
  }
  return true;
}

// Versiones disponibles del otro formato: botellas si es decant, decants si es botella.
export function otrosFormatosDisponibles(parfum, todos = []) {
  return todos
    .filter(
      (p) =>
        esMismoPerfume(parfum, p) &&
        p.stock !== parfum.stock &&
        p.disponible === "Disponible",
    )
    .sort((a, b) => (Number(a.precio) || 0) - (Number(b.precio) || 0));
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
