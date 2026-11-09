// URL principal de cada perfume para Google.
// Desde que el decant y la botella del mismo perfume comparten página, las dos
// URLs (/product/x/ID_DECANT y /product/x/ID_BOTELLA) muestran lo mismo. Para
// que Google no las trate como duplicadas, las dos dicen que la principal es
// la del id más bajo, y solo esa va en el sitemap.
//
// Misma regla que esMismoPerfume (src/functions/mismoPerfume.js); está aquí
// sin imports para poder usarla también en las funciones de /api.

const clave = (v) =>
  (v ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/eaudeparfum/g, "edp")
    .replace(/eaudetoilette/g, "edt")
    .replace(/extraitdeparfum/g, "extrait");

function mismo(a, b) {
  if (!a || !b) return false;
  if (clave(a.nombre) !== clave(b.nombre) || clave(a.casa) !== clave(b.casa)) return false;
  if (a.concentracion && b.concentracion && clave(a.concentracion) !== clave(b.concentracion)) {
    return false;
  }
  return true;
}

/** La fila principal del perfume (id más bajo entre sus versiones). */
export function filaPrincipal(parfum, todos = []) {
  if (!parfum) return parfum;
  return todos
    .filter((p) => p.id !== parfum.id && mismo(parfum, p))
    .reduce((a, b) => (Number(b.id) < Number(a.id) ? b : a), parfum);
}

/** Deja una sola fila por perfume (la principal). */
export function soloPrincipales(todos = []) {
  return todos.filter((p) => filaPrincipal(p, todos).id === p.id);
}
