import supabase from "../services/supabase";
import { slugify } from "./slugify";

const SITE_URL = "https://perfumesdediego.com";

async function enviar(body) {
  // Solo en producción: en tu computadora (npm run dev) no avisa nada.
  if (typeof window === "undefined" || window.location.hostname !== "perfumesdediego.com") {
    return { ok: false, omitido: true };
  }
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return { ok: false };
  const r = await fetch("/api/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return r.json().catch(() => ({ ok: false }));
}

/**
 * Avisa a Bing que cambió un perfume (su página y la de su casa).
 * No bloquea ni lanza errores: si falla, el guardado ya se hizo igual.
 */
export function avisarPerfume(perfume) {
  if (!perfume?.id || !perfume?.nombre) return;
  const urls = [`${SITE_URL}/product/${slugify(perfume.nombre)}/${perfume.id}`];
  if (perfume.casa) urls.push(`${SITE_URL}/casa/${slugify(perfume.casa)}`);
  enviar({ urls }).catch(() => {});
}

/** Avisa a Bing que cambió un artículo publicado del blog. */
export function avisarPost(post) {
  if (!post?.slug || !post?.publicado) return;
  enviar({ urls: [`${SITE_URL}/blog/${post.slug}`, `${SITE_URL}/blog`] }).catch(() => {});
}

/** Avisa a Bing de todas las páginas del sitio (botón del admin). */
export function avisarTodo() {
  return enviar({ todo: true });
}
