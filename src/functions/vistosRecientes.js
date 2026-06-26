// Guarda y lee los últimos perfumes vistos (localStorage). Guarda el objeto
// completo para poder pintar la tarjeta sin volver a consultar la base.
const KEY = "vistosRecientes";
const MAX = 8;

export function leerVistos() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registrarVisto(parfum) {
  if (!parfum || !parfum.id) return;
  try {
    const previos = leerVistos().filter((p) => p.id !== parfum.id);
    const lista = [parfum, ...previos].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(lista));
  } catch {
    // localStorage no disponible (modo privado, etc.) — ignorar
  }
}

export function getVistosRecientes(excluirId) {
  return leerVistos().filter((p) => p.id !== excluirId);
}
