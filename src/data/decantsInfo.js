/**
 * Texto de la página /decants. Lo usan la página que ven los clientes
 * (src/ui/DecantsInfo.jsx) y la versión para Google (src/seo/paginasBot.js),
 * para que las dos digan exactamente lo mismo.
 */
export const decantsTitulo = "Decants de perfumes nicho originales en México";

export const decantsDescripcion =
  "Decants desde 1 ml de perfumes nicho y ultra nicho, 100% originales, tomados de la botella. Envíos a todo México con DHL y envío gratis desde $1,950.";

export const decantsPreguntas = [
  {
    pregunta: "¿Qué es un decant?",
    respuesta:
      "Es una porción del perfume original, pasada de la botella a un atomizador más chico. Te permite probar un perfume por días, en tu piel, antes de pagar el frasco completo.",
  },
  {
    pregunta: "¿Son originales?",
    respuesta:
      "Sí. Todos salen de botellas originales que compro a distribuidores autorizados. No vendo réplicas ni \"inspirados en\".",
  },
  {
    pregunta: "¿Cuántos ml me conviene?",
    respuesta:
      "1 o 2 ml para probar, 5 ml para usarlo unas semanas y 10 ml si ya sabes que te gusta.",
  },
  {
    pregunta: "¿Cómo llega?",
    respuesta:
      "Por DHL a todo México. El envío es gratis en pedidos de decants desde $1,950 a zona regular.",
  },
];

// Busca la guía de decants del blog (la reseña publicada cuyo título
// menciona "decant"). Si no la encuentra, el link va al blog.
export async function slugGuiaDecants(supabase) {
  try {
    const { data } = await supabase
      .from("posts")
      .select("slug")
      .eq("publicado", true)
      .ilike("titulo", "%decant%")
      .order("creado_en", { ascending: true })
      .limit(1);
    return data?.[0]?.slug || null;
  } catch {
    return null;
  }
}
