/**
 * Convierte un string en un slug URL-friendly.
 * Quita tildes, pasa a minúsculas, reemplaza caracteres no alfanuméricos
 * por guiones, y limpia guiones iniciales/finales.
 */
export function slugify(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}