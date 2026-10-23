/**
 * api/indexnow.js — avisa a Bing (y a los buscadores que usan IndexNow) que
 * unas páginas del sitio cambiaron, para que las vuelvan a leer pronto.
 * Bing es el índice que usa ChatGPT para buscar.
 *
 * POST { urls: ["https://perfumesdediego.com/..."] }  → avisa esas URLs
 * POST { todo: true }                                  → avisa todo el sitio
 *
 * Solo funciona con sesión de admin (token de Supabase en Authorization).
 * La clave pública vive en /public/<CLAVE>.txt, como pide IndexNow.
 */
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://perfumesdediego.com";
const HOST = "perfumesdediego.com";
const CLAVE = "1fa3a145af6470049291d17146878912";

const RUTAS_FIJAS = [
  "/",
  "/home",
  "/decants",
  "/botellas",
  "/best-sellers",
  "/recien-llegados",
  "/casas",
  "/sobre-mi",
  "/tiktok",
  "/pedido-especial",
  "/testimonios",
  "/faqs",
  "/blog",
];

function slugify(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function todasLasUrls(supabase) {
  const urls = RUTAS_FIJAS.map((p) => `${SITE_URL}${p === "/" ? "" : p}`);
  const { data: parfums } = await supabase.from("parfums").select("id, nombre, casa");
  const casas = new Set();
  for (const p of parfums || []) {
    const s = slugify(p.nombre);
    if (s && p.id != null) urls.push(`${SITE_URL}/product/${s}/${p.id}`);
    const c = slugify(p.casa);
    if (c) casas.add(c);
  }
  for (const c of casas) urls.push(`${SITE_URL}/casa/${c}`);
  const { data: posts } = await supabase
    .from("posts")
    .select("slug")
    .eq("publicado", true);
  for (const p of posts || []) if (p.slug) urls.push(`${SITE_URL}/blog/${p.slug}`);
  return urls;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Usa POST" });
    return;
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
  );

  // Solo el admin (usuario con sesión iniciada en Supabase).
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const { data: auth } = token
    ? await supabase.auth.getUser(token)
    : { data: null };
  if (!auth?.user) {
    res.status(401).json({ error: "Sin sesión de admin" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  let urls = body?.todo
    ? await todasLasUrls(supabase)
    : Array.isArray(body?.urls)
      ? body.urls
      : [];
  // Solo URLs de este sitio, sin repetir.
  urls = [...new Set(urls.filter((u) => typeof u === "string" && u.startsWith(SITE_URL)))];

  if (urls.length === 0) {
    res.status(400).json({ error: "Sin URLs válidas" });
    return;
  }

  const payload = JSON.stringify({
    host: HOST,
    key: CLAVE,
    keyLocation: `${SITE_URL}/${CLAVE}.txt`,
    urlList: urls.slice(0, 10000),
  });

  // Primero directo a Bing (el que usa ChatGPT); si no lo acepta, al
  // distribuidor general de IndexNow. Se regresa el detalle para diagnosticar.
  // 200/202 = recibido. 403 = clave no válida todavía. 422 = URL inválida.
  try {
    const intentos = [];
    for (const endpoint of [
      "https://www.bing.com/indexnow",
      "https://api.indexnow.org/indexnow",
    ]) {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: payload,
      });
      const detalle = (await r.text().catch(() => "")).slice(0, 300);
      intentos.push({ endpoint, status: r.status, detalle });
      if (r.status === 200 || r.status === 202) {
        res.status(200).json({ ok: true, status: r.status, enviadas: urls.length, intentos });
        return;
      }
    }
    const ultimo = intentos[intentos.length - 1];
    res.status(200).json({ ok: false, status: ultimo.status, enviadas: 0, intentos });
  } catch (e) {
    console.error("IndexNow error:", e);
    res.status(502).json({ ok: false, error: "No se pudo contactar IndexNow" });
  }
}
