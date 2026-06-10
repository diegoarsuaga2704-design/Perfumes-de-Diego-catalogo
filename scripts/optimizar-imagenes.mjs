/**
 * optimizar-imagenes.mjs  (v2 — sin storage.list)
 * -----------------------------------------------------------------------------
 * Baja el Cached Egress de Supabase Storage SIN usar storage.list() (que en
 * este proyecto devuelve "Method Not Allowed").
 *
 * Cómo trabaja:
 *   1. Lee las tablas (parfums, casas, testimonios) y detecta toda URL que
 *      apunte a Supabase Storage (cualquier columna).
 *   2. Descarga cada imagen por su URL pública (con fetch normal, sin SDK).
 *   3. Guarda el ORIGINAL en ./backup-imagenes/<bucket>/<ruta>.
 *   4. La reduce (máx. ancho + recompresión) SIN cambiar formato ni ruta.
 *   5. La vuelve a subir a la MISMA ruta con cacheControl de 30 días
 *      (mismo método de subida que ya usa tu panel admin, que sí funciona).
 *
 * Por defecto: MODO PRUEBA (DRY_RUN). Solo reporta, no sube ni respalda.
 *
 * Requisitos:  npm install sharp @supabase/supabase-js
 *
 * Uso (PowerShell, raíz del repo). La URL se lee sola de tu .env:
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ_TU_SERVICE_ROLE"
 *   node scripts/optimizar-imagenes.mjs                          # prueba
 *   $env:DRY_RUN="false"; node scripts/optimizar-imagenes.mjs    # real
 * -----------------------------------------------------------------------------
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

// ---------- Configuración ----------
const TABLAS = ["parfums", "casas", "testimonios"];
const MAX_WIDTH = 1000;
const QUALITY = 72;
const CACHE_SECONDS = 2592000; // 30 días
const DRY_RUN = process.env.DRY_RUN !== "false";
const BACKUP_DIR = "./backup-imagenes";
const FORMATOS = new Set(["jpeg", "jpg", "png", "webp"]);
const BUCKETS_IMG = new Set([
  "perfumsImages",
  "casasImages",
  "testimoniosImages",
]);

// ---------- Credenciales ----------
function leerEnv(clave) {
  try {
    const txt = readFileSync(".env", "utf8");
    const m = txt.match(new RegExp(`^${clave}\\s*=\\s*(.+)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    return null;
  }
}

let SUPABASE_URL = (process.env.SUPABASE_URL || leerEnv("VITE_SUPABASE_URL") || "")
  .trim()
  .replace(/\/+$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, "");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("\nFalta SUPABASE_URL (.env) o SUPABASE_SERVICE_ROLE_KEY.\n");
  process.exit(1);
}
if (!SUPABASE_URL.includes(".supabase.co")) {
  console.error(`\nLa URL "${SUPABASE_URL}" no parece de Supabase (.supabase.co).\n`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const fmt = (b) => `${(b / 1024).toFixed(0)} KB`;

// Detecta bucket + ruta dentro de una URL pública de Storage
const RE_STORAGE = /\/storage\/v1\/object\/(?:public\/|sign\/)?([^/]+)\/([^?]+)/;
function parseStorageUrl(valor) {
  if (typeof valor !== "string") return null;
  const m = valor.match(RE_STORAGE);
  if (!m) return null;
  return { bucket: m[1], ruta: decodeURIComponent(m[2]) };
}

// Recolecta todas las imágenes referenciadas en las tablas (sin storage.list)
async function recolectar() {
  const mapa = new Map(); // "bucket/ruta" -> { bucket, ruta, url }
  for (const tabla of TABLAS) {
    // Leer TODAS las filas, paginando por si el servidor limita.
    const filas = [];
    let desde = 0;
    while (true) {
      const { data, error } = await supabase
        .from(tabla)
        .select("*")
        .range(desde, desde + 999);
      if (error) {
        console.log(`  ! no pude leer la tabla "${tabla}": ${error.message}`);
        break;
      }
      if (!data || data.length === 0) break;
      filas.push(...data);
      desde += data.length;
      if (data.length < 1000) break;
    }

    let urls = 0;
    let agregadas = 0;
    for (const row of filas) {
      for (const valor of Object.values(row)) {
        const info = parseStorageUrl(valor);
        if (!info || !BUCKETS_IMG.has(info.bucket)) continue;
        urls++;
        const k = `${info.bucket}/${info.ruta}`;
        if (!mapa.has(k)) {
          mapa.set(k, { ...info, url: valor.split("?")[0] });
          agregadas++;
        }
      }
    }
    console.log(
      `  tabla ${tabla}: ${filas.length} filas | ${urls} URLs de storage | ${agregadas} imágenes nuevas`,
    );
  }
  return [...mapa.values()];
}

async function recomprimir(buffer) {
  const img = sharp(buffer, { failOn: "none" });
  const meta = await img.metadata();
  let pipe = img.resize({
    width: MAX_WIDTH,
    height: MAX_WIDTH,
    fit: "inside",
    withoutEnlargement: true,
  });
  if (meta.format === "png") pipe = pipe.png({ compressionLevel: 9, quality: QUALITY });
  else if (meta.format === "webp") pipe = pipe.webp({ quality: QUALITY });
  else if (meta.format === "avif" || meta.format === "heif")
    pipe = pipe.avif({ quality: QUALITY });
  else pipe = pipe.jpeg({ quality: QUALITY, mozjpeg: true });
  return pipe.toBuffer();
}

async function main() {
  console.log(
    DRY_RUN
      ? "\n*** MODO PRUEBA (DRY_RUN) — no se sube ni respalda nada ***"
      : "\n*** EJECUCIÓN REAL — respalda originales y re-sube optimizadas ***",
  );

  const imgs = await recolectar();
  console.log(`\nImágenes encontradas en las tablas: ${imgs.length}\n`);

  let antes = 0;
  let despues = 0;
  let ok = 0;

  for (const img of imgs) {
    let res;
    try {
      res = await fetch(img.url);
    } catch (e) {
      console.log(`  ! no se pudo bajar ${img.ruta} (${e.message})`);
      continue;
    }
    if (!res.ok) {
      console.log(`  ! ${img.ruta} -> HTTP ${res.status}`);
      continue;
    }
    const original = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || undefined;

    let nuevo;
    try {
      nuevo = await recomprimir(original);
    } catch (e) {
      console.log(`  ! no se pudo procesar ${img.ruta} (${e.message})`);
      continue;
    }
    if (nuevo.length >= original.length) nuevo = original; // no empeorar

    antes += original.length;
    despues += nuevo.length;
    ok++;
    const ahorro = ((1 - nuevo.length / Math.max(original.length, 1)) * 100).toFixed(0);
    console.log(
      `  [${img.bucket}] ${img.ruta}: ${fmt(original.length)} -> ${fmt(nuevo.length)} (-${ahorro}%)`,
    );

    if (!DRY_RUN) {
      const destino = path.join(BACKUP_DIR, img.bucket, img.ruta);
      await fs.mkdir(path.dirname(destino), { recursive: true });
      await fs.writeFile(destino, original);

      const { error: upErr } = await supabase.storage
        .from(img.bucket)
        .upload(img.ruta, nuevo, {
          upsert: true,
          cacheControl: String(CACHE_SECONDS),
          contentType,
        });
      if (upErr) console.log(`  ! error subiendo ${img.ruta}: ${upErr.message}`);
    }
  }

  const mb = (b) => (b / 1024 / 1024).toFixed(1);
  const pct = antes ? ((1 - despues / antes) * 100).toFixed(0) : 0;
  console.log("\n================ RESUMEN ================");
  console.log(`Imágenes procesadas: ${ok}`);
  console.log(`Peso actual:         ${mb(antes)} MB`);
  console.log(`Peso optimizado:     ${mb(despues)} MB`);
  console.log(`Ahorro por descarga: ${pct}%`);
  if (DRY_RUN) {
    console.log('\nSe veía bien? Corre con  $env:DRY_RUN="false"  para aplicarlo.');
  } else {
    console.log(`\nListo. Originales respaldados en ${BACKUP_DIR}/`);
  }
  console.log("=========================================\n");
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
