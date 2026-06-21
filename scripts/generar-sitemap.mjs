/**
 * generar-sitemap.mjs
 * --------------------------------------------------------------------------
 * Genera public/sitemap.xml COMPLETO a partir del catálogo en Supabase:
 *   - Rutas fijas (home, decants, botellas, casas, etc.)
 *   - Una URL por cada producto:  /product/{slug-del-nombre}/{id}
 *   - Una URL por cada casa:      /casa/{slug-de-la-casa}
 *
 * Las credenciales se leen solas de tu .env (VITE_SUPABASE_URL +
 * VITE_SUPABASE_ANON_KEY). La llave anónima basta: parfums es de lectura
 * pública. No necesitas configurar variables de entorno.
 *
 * USO (PowerShell, en la raíz del proyecto):
 *   node scripts/generar-sitemap.mjs
 *
 * Luego revisa public/sitemap.xml, y haz commit + push.
 * --------------------------------------------------------------------------
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

// ---------- Configuración ----------
// Si algún día tienes dominio propio, cambia SOLO esta línea.
const BASE_URL = "https://perfumesdediego.com";

// Rutas fijas e indexables (sin /admin y sin /paquetes, que ya no existe).
const RUTAS_FIJAS = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/home", changefreq: "daily", priority: "0.9" },
  { path: "/decants", changefreq: "daily", priority: "0.9" },
  { path: "/botellas", changefreq: "daily", priority: "0.9" },
  { path: "/best-sellers", changefreq: "weekly", priority: "0.9" },
  { path: "/recien-llegados", changefreq: "weekly", priority: "0.8" },
  { path: "/casas", changefreq: "weekly", priority: "0.8" },
  { path: "/sobre-mi", changefreq: "monthly", priority: "0.6" },
  { path: "/tiktok", changefreq: "weekly", priority: "0.7" },
  { path: "/testimonios", changefreq: "weekly", priority: "0.7" },
  { path: "/faqs", changefreq: "monthly", priority: "0.5" },
];

// ---------- Credenciales (se leen del .env) ----------
function leerEnv(clave) {
  try {
    let txt = readFileSync(".env", "utf8");
    txt = txt.replace(/^\uFEFF/, ""); // quitar BOM si lo hay
    for (const linea of txt.split(/\r?\n/)) {
      const l = linea.trim();
      if (!l || l.startsWith("#")) continue;
      const eq = l.indexOf("=");
      if (eq === -1) continue;
      const nombre = l.slice(0, eq).trim();
      if (nombre === clave) {
        return l
          .slice(eq + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    }
    return null;
  } catch {
    return null;
  }
}

const SUPABASE_URL = (process.env.SUPABASE_URL || leerEnv("VITE_SUPABASE_URL") || "")
  .trim()
  .replace(/\/+$/, "");
const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  leerEnv("VITE_SUPABASE_ANON_KEY") ||
  ""
).replace(/\s+/g, "");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "\nFalta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en tu .env.\n",
  );
  process.exit(1);
}
if (!SUPABASE_URL.includes(".supabase.co")) {
  console.error(`\nLa URL "${SUPABASE_URL}" no parece de Supabase.\n`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- slugify (idéntico al de src/functions/slugify) ----------
function slugify(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------- Traer TODOS los parfums (paginando de 1000 en 1000) ----------
async function traerParfums() {
  const pageSize = 1000;
  let desde = 0;
  const todos = [];
  for (;;) {
    const { data, error } = await supabase
      .from("parfums")
      .select("id, nombre, casa")
      .order("id", { ascending: true })
      .range(desde, desde + pageSize - 1);
    if (error) {
      console.error("\nError leyendo parfums:", error.message, "\n");
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    todos.push(...data);
    if (data.length < pageSize) break;
    desde += pageSize;
  }
  return todos;
}

// ---------- Construir el XML ----------
function nodoUrl({ loc, changefreq, priority }) {
  return (
    "  <url>\n" +
    `    <loc>${loc}</loc>\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority}</priority>\n` +
    "  </url>"
  );
}

async function main() {
  const parfums = await traerParfums();

  // Productos
  const urlsProductos = [];
  for (const p of parfums) {
    const slug = slugify(p.nombre);
    if (!slug || p.id == null) continue; // saltar registros sin nombre/id
    urlsProductos.push({
      loc: `${BASE_URL}/product/${slug}/${p.id}`,
      changefreq: "weekly",
      priority: "0.8",
    });
  }

  // Casas (valores únicos de parfums.casa → así cada /casa/ tiene productos)
  const slugsCasa = new Set();
  for (const p of parfums) {
    const slug = slugify(p.casa);
    if (slug) slugsCasa.add(slug);
  }
  const urlsCasas = [...slugsCasa].sort().map((slug) => ({
    loc: `${BASE_URL}/casa/${slug}`,
    changefreq: "weekly",
    priority: "0.7",
  }));

  // Fijas
  const urlsFijas = RUTAS_FIJAS.map((r) => ({
    loc: `${BASE_URL}${r.path}`,
    changefreq: r.changefreq,
    priority: r.priority,
  }));

  const todas = [...urlsFijas, ...urlsCasas, ...urlsProductos];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    todas.map(nodoUrl).join("\n") +
    "\n</urlset>\n";

  writeFileSync("public/sitemap.xml", xml, "utf8");

  console.log("\n✅ public/sitemap.xml generado");
  console.log(`   • ${urlsFijas.length} rutas fijas`);
  console.log(`   • ${urlsCasas.length} casas`);
  console.log(`   • ${urlsProductos.length} productos`);
  console.log(`   • ${todas.length} URLs en total\n`);
}

main();
