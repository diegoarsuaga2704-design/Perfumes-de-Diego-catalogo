const DIAS_NUEVO = 7;

/**
 * Fuente ÚNICA de la lógica de badges de estatus.
 * Prioridad: AGOTADO > PRÓXIMAMENTE > NUEVO.
 * Devuelve { texto, color } del badge a mostrar, o null si no aplica ninguno.
 * El badge "MEJOR VENDIDO" se quitó a propósito para no estorbar la imagen
 * del perfume (el campo esBestSeller sigue usándose en la sección /best-sellers).
 */
export function getBadgeEstatus(parfum) {
  if (parfum.disponible === "Agotado") {
    return { texto: "AGOTADO", color: "bg-red-600" };
  }
  if (parfum.disponible === "Próximamente") {
    return { texto: "PRÓXIMAMENTE", color: "bg-sky-600" };
  }
  if (parfum.disponible_desde) {
    const dias =
      (new Date() - new Date(parfum.disponible_desde)) / (1000 * 60 * 60 * 24);
    if (dias <= DIAS_NUEVO) {
      return { texto: "NUEVO", color: "bg-emerald-500" };
    }
  }
  return null;
}
