// Redimensiona y optimiza imágenes a través de wsrv.nl (gratis, cacheado en
// Cloudflare). Reduce el egress de Supabase: wsrv descarga la imagen una vez,
// la cachea y sirve una versión más chica en WebP a todos los visitantes.
// Si wsrv fallara, en el <img> hacemos fallback a la URL original de Supabase.
export function imagenThumb(url, width = 440) {
  if (!url || typeof url !== "string") return url;
  if (!/^https?:\/\//.test(url)) return url; // solo URLs http(s)
  const sinProtocolo = url.replace(/^https?:\/\//, "");
  return `https://wsrv.nl/?url=${encodeURIComponent(
    sinProtocolo,
  )}&w=${width}&q=72&output=webp&we`;
}
