// Interruptor del pago en línea con Mercado Pago.
// Apagado mientras no exista la variable VITE_PAGO_LINEA=1 en Vercel. Con el
// interruptor apagado la tienda se ve y funciona como siempre (solo WhatsApp).
// Para activarlo: MP_ACCESS_TOKEN, SUPABASE_SERVICE_ROLE_KEY y VITE_PAGO_LINEA=1
// en Vercel, y volver a publicar (Redeploy).
export const PAGO_LINEA =
  (import.meta.env?.VITE_PAGO_LINEA ?? globalThis.process?.env?.VITE_PAGO_LINEA) === "1";
