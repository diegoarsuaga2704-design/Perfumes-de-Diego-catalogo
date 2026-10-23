/**
 * Textos SEO de la página de producto.
 * Los usan la página (ProductDetail) y el HTML que ve Google (api/og.mjs),
 * para que los dos digan exactamente lo mismo.
 */

/**
 * Título para Google, WhatsApp y la pestaña del navegador.
 * "Kaleidoscope Mind de Benneviento — Decant en México"
 * stock === true → registro de botella; si no, decant.
 */
export function tituloSeoProducto(parfum) {
  if (!parfum) return "";
  const base = `${parfum.nombre}${parfum.casa ? ` de ${parfum.casa}` : ""}`;
  return `${base} — ${parfum.stock === true ? "Botella" : "Decant"} en México`;
}

/** Recorta en la última palabra completa antes del límite. */
function recortar(texto, max) {
  const limpio = (texto || "").replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  return `${corte.slice(0, corte.lastIndexOf(" "))}…`;
}

/**
 * Meta description (~160 caracteres).
 * Con descripción: "Nombre de Casa (Concentración). <inicio de tu reseña>…"
 * Sin descripción: el texto de siempre con las notas.
 */
export function metaDescripcionProducto(parfum) {
  if (!parfum) return "";
  const base = `${parfum.nombre}${parfum.casa ? ` de ${parfum.casa}` : ""}`;
  if (parfum.descripcion?.trim()) {
    const cabeza = `${base}${parfum.concentracion ? ` (${parfum.concentracion})` : ""}. `;
    return `${cabeza}${recortar(parfum.descripcion, Math.max(60, 160 - cabeza.length))}`;
  }
  return parfum.notas
    ? `${parfum.nombre} (${parfum.concentracion || "Eau de Parfum"})${parfum.casa ? ` de ${parfum.casa}` : ""}. Notas: ${parfum.notas}. Disponible en decant o botella.`
    : `${base}. Disponible para comprar en decant o botella.`;
}

/** Descripción en párrafos (separados por línea en blanco). */
export function parrafosDescripcion(texto) {
  return (texto || "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}
