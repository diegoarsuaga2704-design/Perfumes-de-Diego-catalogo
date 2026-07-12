// Guarda solo los IDs de los últimos perfumes vistos (localStorage). Los datos
// (precio, disponibilidad) se releen FRESCOS desde ParfumsContext al pintar,
// para no mostrar información congelada.
const KEY = "vistosRecientes";
const MAX = 8;

// Lee los IDs. Migra en caliente el formato viejo (objetos completos) a IDs.
function leerIds() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => (x && typeof x === "object" ? x.id : x))
      .filter((x) => x != null);
  } catch {
    return [];
  }
}

export function registrarVisto(parfum) {
  const id = parfum && typeof parfum === "object" ? parfum.id : parfum;
  if (id == null) return;
  try {
    const previos = leerIds().filter((x) => String(x) !== String(id));
    const lista = [id, ...previos].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(lista));
  } catch {
    // localStorage no disponible (modo privado, etc.) — ignorar
  }
}

export function getVistosIds(excluirId) {
  return leerIds().filter((x) => String(x) !== String(excluirId));
}
