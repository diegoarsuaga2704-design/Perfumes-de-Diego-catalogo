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

const SITE_URL = "https://perfumes-de-diego-catalogo.vercel.app";
const DEFAULT_IMAGE =
  "https://xpxfacujdaiugphvpili.supabase.co/storage/v1/object/public/perfumsImages/perfumes-de-diego-letras-horizontal.png";
const SITE_NAME = "Perfumes de Diego";

function buildOgHtml({ title, description, image, url }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
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
<body></body>
</html>`;
}

export default async function handler(req, res) {
  const ua = req.headers["user-agent"] || "";
  const isBot = BOT_PATTERN.test(ua);

  if (!isBot) {
    // Visitante humano: servir el shell del SPA. Si no se pudo leer del
    // bundle (spaHtml vacío), traerlo por HTTP del propio sitio para no
    // mostrar una pantalla en blanco.
    let html = spaHtml;
    if (!html || html.length < 200) {
      try {
        const r = await fetch(`${SITE_URL}/index.html`);
        if (r.ok) html = await r.text();
      } catch (e) {
        console.error("No se pudo obtener el shell del SPA:", e);
      }
    }
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
      }
    }
  } catch (err) {
    console.error("OG error:", err);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.status(200).send(buildOgHtml({ title, description, image, url }));
}
