import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let spaHtml;
try {
  spaHtml = readFileSync(join(__dirname, "..", "dist", "index.html"), "utf-8");
} catch {
  spaHtml = "<!DOCTYPE html><html><head><meta charset=UTF-8/></head><body></body></html>";
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|WhatsApp|facebookexternalhit|Twitterbot|TelegramBot|Discordbot|Slackbot|LinkedInBot|Applebot|Googlebot|Bingbot|DuckDuckBot|Pinterest|Snapchat|metatag|opengraph|iframely|embedly|preview|MetaInspector|curl|wget|python-requests/i;

function slugify(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function esc(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const SITE_URL = "https://perfumesdediego.com";
const DEFAULT_IMAGE =
  "https://xpxfacujdaiugphvpili.supabase.co/storage/v1/object/public/perfumsImages/foto%20portada.jpeg";
const SITE_NAME = "Perfumes de Diego";

function buildOgHtml({ title, description, image, url, bodyHtml = "" }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${esc(url)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:site_name" content="${esc(SITE_NAME)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
</head>
<body>${bodyHtml}</body>
</html>`;
}

export default async function handler(req, res) {
  const ua = req.headers["user-agent"] || "";
  const isBot = BOT_PATTERN.test(ua);

  if (!isBot) {
    // Visitante humano: traer SIEMPRE el shell actual del sitio estático por
    // HTTP, sin depender de que el archivo del bundle se haya leído bien
    // (esa dependencia causaba pantallas en blanco intermitentes).
    let html = "";
    try {
      const r = await fetch(`${SITE_URL}/index.html`);
      if (r.ok) html = await r.text();
    } catch (e) {
      console.error("No se pudo obtener el shell del SPA:", e);
    }
    if (!html || html.length < 200) html = spaHtml; // último recurso
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(html);
    return;
  }

  const { type, id, slug } = req.query;

  let title = SITE_NAME;
  let description = "Decants y botellas de perfumes de nicho en Mexico.";
  let image = DEFAULT_IMAGE;
  let url = SITE_URL;
  let bodyHtml = `<h1>${esc(SITE_NAME)}</h1><p>${esc(description)}</p>`;

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
    );

    if (type === "product" && id) {
      const { data: perfume } = await supabase
        .from("parfums")
        .select("nombre, casa, image, notas, concentracion")
        .eq("id", id)
        .single();

      if (perfume) {
        title = `${perfume.nombre}${perfume.casa ? ` de ${perfume.casa}` : ""} | ${SITE_NAME}`;
        description = perfume.notas
          ? `${perfume.nombre}${perfume.concentracion ? ` (${perfume.concentracion})` : ""}. Notas: ${perfume.notas}. Disponible en decant o botella.`
          : `${perfume.nombre}${perfume.casa ? ` de ${perfume.casa}` : ""}. Disponible en decant o botella.`;
        image = perfume.image || DEFAULT_IMAGE;
        url = `${SITE_URL}/product/${slugify(perfume.nombre)}/${id}`;
        const h1 = `${perfume.nombre}${perfume.casa ? ` de ${perfume.casa}` : ""}`;
        bodyHtml =
          `<h1>${esc(h1)}</h1>` +
          (perfume.concentracion
            ? `<p>Concentración: ${esc(perfume.concentracion)}</p>`
            : "") +
          (perfume.notas
            ? `<p>Notas olfativas: ${esc(perfume.notas)}</p>`
            : "") +
          `<p>Disponible en decant para probar o en botella completa. Envíos a todo México.</p>` +
          `<p><a href="${esc(url)}">Ver ${esc(perfume.nombre)} en ${esc(SITE_NAME)}</a></p>`;
      }
    } else if (type === "casa" && slug) {
      const { data: casas } = await supabase
        .from("casas")
        .select("nombre, imagen_hero, descripcion");

      const casa = (casas || []).find((c) => slugify(c.nombre) === slug);

      if (casa) {
        title = `${casa.nombre} | ${SITE_NAME}`;
        description =
          casa.descripcion ||
          `Coleccion de perfumes de ${casa.nombre}. Decants y botellas disponibles.`;
        image = casa.imagen_hero || DEFAULT_IMAGE;
        url = `${SITE_URL}/casa/${slug}`;
        bodyHtml =
          `<h1>${esc(casa.nombre)}</h1>` +
          (casa.descripcion ? `<p>${esc(casa.descripcion)}</p>` : "") +
          `<p>Explora los decants y botellas de ${esc(casa.nombre)} disponibles en ${esc(SITE_NAME)}.</p>` +
          `<p><a href="${esc(url)}">Ver perfumes de ${esc(casa.nombre)}</a></p>`;
      }
    }
  } catch (err) {
    console.error("OG error:", err);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.status(200).send(buildOgHtml({ title, description, image, url, bodyHtml }));
}
