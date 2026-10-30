import supabase from "../services/supabase";

// Tarjetas de la portada (/). Las fotos se pueden cambiar desde
// /admin/portada; si no hay foto guardada se usa la de siempre.
const BASE = "https://xpxfacujdaiugphvpili.supabase.co/storage/v1/object/public/perfumsImages/";

export const TARJETAS_PORTADA = [
  {
    clave: "decants",
    image: `${BASE}o.rZpkAR0ZbQi.jpg`,
    title: "Decants",
    to: "/decants",
    description: "Prueba tus perfumes favoritos antes de comprar el frasco completo.",
  },
  {
    clave: "best-sellers",
    image: `${BASE}foto%20portada.jpeg`,
    title: "Mejor vendidos",
    to: "/best-sellers",
    description: "Los favoritos de mis clientes.",
  },
  {
    clave: "botellas",
    image: `${BASE}haec%20foto.webp`,
    title: "Botellas completas y parciales",
    to: "/botellas",
    description: "Perfumes sellados y parciales disponibles.",
  },
];

const KEY_CACHE = "perfumes-diego-portada";

/** Fotos guardadas la última vez (para mostrarlas sin esperar). */
export function leerFotosCache() {
  try {
    return JSON.parse(localStorage.getItem(KEY_CACHE) || "null");
  } catch {
    return null;
  }
}

/** { clave: imagen } desde Supabase. Si falla, devuelve {}. */
export async function getFotosPortada() {
  const { data, error } = await supabase.from("config_portada").select("clave, imagen");
  if (error) {
    console.error("Error leyendo config_portada:", error);
    return {};
  }
  const fotos = Object.fromEntries(
    (data || []).filter((r) => r.imagen).map((r) => [r.clave, r.imagen]),
  );
  try {
    localStorage.setItem(KEY_CACHE, JSON.stringify(fotos));
  } catch {
    // sin localStorage
  }
  return fotos;
}

export async function guardarFotoPortada(clave, imagen) {
  const { error } = await supabase
    .from("config_portada")
    .upsert({ clave, imagen, updated_at: new Date().toISOString() }, { onConflict: "clave" });
  if (error) throw error;
}
