/**
 * middleware.js — se ejecuta en Vercel ANTES de servir archivos.
 *
 * Solo actúa en la página de inicio ("/"): si quien entra es un buscador o
 * un asistente de IA, le entrega la versión con texto (api/og). Hace falta
 * aquí porque en "/" Vercel sirve index.html directo y las reglas de
 * vercel.json no alcanzan a aplicarse.
 *
 * Los clientes no pasan por aquí: para ellos no se hace nada y ven el sitio
 * normal. Si algo fallara, también se sigue con el sitio normal.
 */
export const config = { matcher: "/" };

// Misma lista que en vercel.json y api/og.mjs.
const BOTS =
  /bot|crawl|spider|facebookexternalhit|whatsapp|embed|slack|discord|telegram|pinterest|preview|linkedin|skype|vkshare|perplexity|claude|anthropic|chatgpt|gpt|oai-search|cohere|google-extended|google-inspectiontool|meta-external|duckassist|mistral/i;

export default function middleware(request) {
  try {
    const ua = request.headers.get("user-agent") || "";
    if (!BOTS.test(ua)) return; // cliente: sitio normal

    const destino = new URL("/api/og?type=pagina&ruta=inicio", request.url);
    return new Response(null, {
      headers: { "x-middleware-rewrite": destino.toString() },
    });
  } catch {
    return; // ante cualquier error, sitio normal
  }
}
