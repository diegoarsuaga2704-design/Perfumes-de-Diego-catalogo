// Texto para comparar en búsquedas: minúsculas y sin acentos,
// así "ambar" encuentra "Ámbar".
export function normalizarTexto(v) {
  return (v ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
