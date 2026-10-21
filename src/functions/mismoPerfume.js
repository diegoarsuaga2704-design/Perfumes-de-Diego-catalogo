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
