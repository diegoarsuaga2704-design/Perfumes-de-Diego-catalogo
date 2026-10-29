/**
 * Versión en HTML simple de las páginas generales del sitio (inicio,
 * catálogo, casas, FAQs, etc.) para buscadores y asistentes de IA.
 * La usa api/og.mjs. Los clientes nunca ven esto: ven la página normal.
 *
 * Además del texto, cada página lleva links reales a los perfumes, para que
 * Google descubra y rastree las páginas de producto.
 */
import { slugify } from "../functions/slugify.js";
import { faqs } from "../data/faqs.js";
import { sobreMiIntro, sobreMiSecciones } from "../data/sobreMi.js";
import {
  inicioTitulo,
  inicioDescripcion,
  inicioParrafos,
} from "../data/inicio.js";
import { garantias } from "../data/garantias.js";

const SITE_URL = "https://perfumesdediego.com";
const SITE_NAME = "Perfumes de Diego";

/** "Cómo trabajo en Perfumes de Diego": garantías concretas de cada pedido. */
export function garantiasHtml() {
  return (
    `<h2>Cómo trabajo en ${SITE_NAME}</h2><ul>` +
    garantias
      .map((g) => `<li><strong>${escHtml(g.titulo)}.</strong> ${escHtml(g.texto)}</li>`)
      .join("") +
    `</ul><p><a href="${SITE_URL}/faqs">Preguntas frecuentes</a></p>`
  );
}

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const negritas = (s) =>
  esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

const urlPerfume = (p) => `${SITE_URL}/product/${slugify(p.nombre)}/${p.id}`;
const urlCasa = (casa) => `${SITE_URL}/casa/${slugify(casa)}`;
const tipo = (p) => (p.stock === true ? "botella" : "decant");

/** Lista de links a perfumes: "Nombre — Casa (decant)". */
export function listaPerfumesHtml(perfumes) {
  if (!perfumes?.length) return "";
  return (
    "<ul>" +
    perfumes
      .map(
        (p) =>
          `<li><a href="${esc(urlPerfume(p))}">${esc(p.nombre)}${
            p.casa ? ` — ${esc(p.casa)}` : ""
          } (${tipo(p)})</a></li>`,
      )
      .join("") +
    "</ul>"
  );
}

const ordenCatalogo = (a, b) =>
  (a.casa || "").localeCompare(b.casa || "", "es") ||
  (a.nombre || "").localeCompare(b.nombre || "", "es");

const NAV =
  `<nav><ul>` +
  [
    ["/", "Inicio"],
    ["/home", "Catálogo"],
    ["/decants", "Decants"],
    ["/botellas", "Botellas"],
    ["/best-sellers", "Más vendidos"],
    ["/recien-llegados", "Recién llegados"],
    ["/casas", "Casas"],
    ["/blog", "Blog"],
    ["/faqs", "Preguntas frecuentes"],
    ["/sobre-mi", "Sobre mí"],
    ["/testimonios", "Testimonios"],
    ["/pedido-especial", "Pedido especial"],
  ]
    .map(([p, t]) => `<li><a href="${SITE_URL}${p === "/" ? "" : p}">${t}</a></li>`)
    .join("") +
  `</ul></nav>`;

// Rutas que existen en el sitio (las demás responden 404 a los robots).
export const RUTAS_BOT = [
  "inicio",
  "home",
  "decants",
  "botellas",
  "best-sellers",
  "recien-llegados",
  "casas",
  "tiktok",
  "faqs",
  "sobre-mi",
  "testimonios",
  "blog",
  "pedido-especial",
  "temporada",
  "terminos",
  "privacidad",
];

async function traerPerfumes(supabase) {
  const { data } = await supabase
    .from("parfums")
    .select("id, nombre, casa, stock, disponible, esBestSeller, tiktokLink, created_at");
  return data || [];
}

/**
 * Devuelve { title, description, url, bodyHtml, jsonLd } o null si la ruta
 * no existe.
 */
export async function paginaBot(supabase, ruta) {
  if (!RUTAS_BOT.includes(ruta)) return null;

  const url = ruta === "inicio" ? SITE_URL : `${SITE_URL}/${ruta}`;
  const jsonLd = [];
  let title = SITE_NAME;
  let description = inicioDescripcion;
  let cuerpo = "";

  const necesitaPerfumes = [
    "inicio",
    "home",
    "decants",
    "botellas",
    "best-sellers",
    "recien-llegados",
    "casas",
    "tiktok",
  ].includes(ruta);
  const perfumes = necesitaPerfumes ? await traerPerfumes(supabase) : [];

  switch (ruta) {
    case "inicio": {
      title = inicioTitulo;
      const best = perfumes.filter((p) => p.esBestSeller).sort(ordenCatalogo);
      const casas = [...new Set(perfumes.map((p) => p.casa).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "es"),
      );
      const { data: posts } = await supabase
        .from("posts")
        .select("slug, titulo")
        .eq("publicado", true)
        .order("creado_en", { ascending: false });
      cuerpo =
        `<h1>${esc(SITE_NAME)}</h1>` +
        inicioParrafos.map((p) => `<p>${esc(p)}</p>`).join("") +
        garantiasHtml() +
        (best.length ? `<h2>Más vendidos</h2>${listaPerfumesHtml(best)}` : "") +
        (casas.length
          ? `<h2>Casas</h2><ul>${casas
              .map((c) => `<li><a href="${esc(urlCasa(c))}">${esc(c)}</a></li>`)
              .join("")}</ul>`
          : "") +
        (posts?.length
          ? `<h2>Reseñas en el blog</h2><ul>${posts
              .map(
                (p) =>
                  `<li><a href="${SITE_URL}/blog/${esc(p.slug)}">${esc(p.titulo)}</a></li>`,
              )
              .join("")}</ul>`
          : "");
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "OnlineStore",
        name: SITE_NAME,
        url: SITE_URL,
        description: inicioDescripcion,
        areaServed: "MX",
      });
      break;
    }

    case "home":
    case "decants":
    case "botellas":
    case "best-sellers":
    case "recien-llegados":
    case "tiktok": {
      const config = {
        home: {
          t: "Catálogo de perfumes",
          d: "Catálogo completo de Perfumes de Diego: decants desde 1 ml y botellas de perfumería de nicho y de diseñador, con envíos a todo México.",
          f: () => true,
        },
        decants: {
          t: "Decants de perfumes",
          d: "Decants para que pruebes tus perfumes favoritos antes de comprar el frasco completo.",
          f: (p) => p.stock !== true,
        },
        botellas: {
          t: "Botellas completas y parciales",
          d: "Perfumes sellados y parciales disponibles para enviar a todo México.",
          f: (p) => p.stock === true,
        },
        "best-sellers": {
          t: "Perfumes más vendidos",
          d: "Los perfumes favoritos de mis clientes. Decants y botellas de los más vendidos en Perfumes de Diego.",
          f: (p) => p.esBestSeller,
        },
        "recien-llegados": {
          t: "Recién llegados",
          d: "Los últimos perfumes que llegaron al catálogo. Novedades de la semana.",
          f: () => true,
        },
        tiktok: {
          t: "Visto en TikTok",
          d: "Los perfumes de los que he hablado en mis videos de TikTok @perfumes_de_diego. Decants y botellas disponibles.",
          f: (p) => !!p.tiktokLink,
        },
      }[ruta];
      title = `${config.t} | ${SITE_NAME}`;
      description = config.d;
      let lista = perfumes.filter(config.f);
      lista =
        ruta === "recien-llegados"
          ? lista
              .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
              .slice(0, 24)
          : lista.sort(ordenCatalogo);
      cuerpo =
        `<h1>${esc(config.t)}</h1><p>${esc(config.d)}</p>` +
        listaPerfumesHtml(lista);
      break;
    }

    case "casas": {
      title = `Casas de perfumería | ${SITE_NAME}`;
      description =
        "Todas las casas de perfumería disponibles en Perfumes de Diego, con decants y botellas.";
      const conteo = {};
      for (const p of perfumes) if (p.casa) conteo[p.casa] = (conteo[p.casa] || 0) + 1;
      const casas = Object.keys(conteo).sort((a, b) => a.localeCompare(b, "es"));
      cuerpo =
        `<h1>Casas de perfumería</h1><p>${esc(description)}</p><ul>` +
        casas
          .map(
            (c) =>
              `<li><a href="${esc(urlCasa(c))}">${esc(c)}</a> (${conteo[c]} ${
                conteo[c] === 1 ? "perfume" : "perfumes"
              })</li>`,
          )
          .join("") +
        "</ul>";
      break;
    }

    case "faqs": {
      title = `Preguntas frecuentes | ${SITE_NAME}`;
      description =
        "¿Qué es un decant? ¿Son originales? ¿Cuánto tarda el envío? Todas las dudas frecuentes resueltas.";
      cuerpo =
        `<h1>Preguntas frecuentes</h1>` +
        garantiasHtml() +
        faqs
          .map((f) => `<h2>${esc(f.pregunta)}</h2><p>${esc(f.respuesta)}</p>`)
          .join("");
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.pregunta,
          acceptedAnswer: { "@type": "Answer", text: f.respuesta },
        })),
      });
      break;
    }

    case "sobre-mi": {
      title = `Sobre mí — ${SITE_NAME}`;
      description =
        "Diego, amante de la perfumería nicho y artesanal. Decants desde 1 ml. Acceso a casas como Ensar Oud, Toskovat, Stephane Humbert Lucas y más.";
      cuerpo =
        `<h1>Sobre mí</h1>` +
        sobreMiIntro.map((p) => `<p>${negritas(p)}</p>`).join("") +
        sobreMiSecciones
          .map(
            (s) =>
              `<h2>${esc(s.titulo)}</h2>` +
              (s.parrafos || []).map((p) => `<p>${negritas(p)}</p>`).join("") +
              (s.lista
                ? `<ul>${s.lista.map((i) => `<li>${negritas(i)}</li>`).join("")}</ul>`
                : ""),
          )
          .join("");
      break;
    }

    case "testimonios": {
      title = `Reseñas y testimonios reales | ${SITE_NAME}`;
      description =
        "Lo que dicen los clientes que ya recibieron sus decants y botellas. Testimonios verificados de Perfumes de Diego.";
      const { data: testimonios } = await supabase
        .from("testimonios")
        .select("nombre, texto")
        .eq("destacado", true);
      cuerpo =
        `<h1>Reseñas y testimonios</h1><p>${esc(description)}</p>` +
        (testimonios || [])
          .filter((t) => t.texto)
          .map(
            (t) =>
              `<blockquote><p>${esc(t.texto)}</p>${
                t.nombre ? `<p>— ${esc(t.nombre)}</p>` : ""
              }</blockquote>`,
          )
          .join("");
      break;
    }

    case "blog": {
      title = `Blog — ${SITE_NAME}`;
      description =
        "Reseñas en español de perfumes de nicho y \"ultra nicho\" disponibles en México.";
      const { data: posts } = await supabase
        .from("posts")
        .select("slug, titulo, extracto")
        .eq("publicado", true)
        .order("creado_en", { ascending: false });
      cuerpo =
        `<h1>Blog</h1>` +
        (posts || [])
          .map(
            (p) =>
              `<h2><a href="${SITE_URL}/blog/${esc(p.slug)}">${esc(p.titulo)}</a></h2>` +
              (p.extracto ? `<p>${esc(p.extracto)}</p>` : ""),
          )
          .join("");
      break;
    }

    case "pedido-especial": {
      title = `Pide tu perfume bajo pedido | ${SITE_NAME}`;
      description =
        "¿Buscas un perfume que no está en la tienda? Escríbelo y te lo cotizo por WhatsApp. Consigo muchas casas bajo pedido.";
      cuerpo = `<h1>Perfumes bajo pedido</h1><p>${esc(description)}</p>`;
      break;
    }

    case "temporada": {
      title = `Colección de temporada | ${SITE_NAME}`;
      description = "Selección de perfumes de temporada en Perfumes de Diego.";
      cuerpo = `<h1>Colección de temporada</h1><p>${esc(description)}</p>`;
      break;
    }

    case "terminos": {
      title = `Términos y condiciones — ${SITE_NAME}`;
      description = "Términos y condiciones de compra en Perfumes de Diego.";
      cuerpo = `<h1>Términos y condiciones</h1><p>${esc(description)}</p>`;
      break;
    }

    case "privacidad": {
      title = `Aviso de privacidad — ${SITE_NAME}`;
      description = "Aviso de privacidad de Perfumes de Diego.";
      cuerpo = `<h1>Aviso de privacidad</h1><p>${esc(description)}</p>`;
      break;
    }
  }

  // El menú va al final: Google suele usar el inicio del texto para la
  // descripción del resultado, y ahí debe ir el contenido de la página.
  return { title, description, url, bodyHtml: cuerpo + NAV, jsonLd };
}

/** Links a otros perfumes de la misma casa (para la página de producto). */
export async function otrosDeLaCasaHtml(supabase, perfume, max = 12) {
  if (!perfume?.casa) return "";
  const { data } = await supabase
    .from("parfums")
    .select("id, nombre, casa, stock")
    .eq("casa", perfume.casa)
    .neq("id", perfume.id)
    .limit(max);
  return data?.length
    ? `<h2>Más perfumes de ${esc(perfume.casa)}</h2>${listaPerfumesHtml(data)}`
    : "";
}

const precioTexto = (p) => {
  const n = Number(p.precio);
  if (!n) return "";
  const monto = `$${n.toLocaleString("es-MX")}`;
  return p.stock === true ? `${monto} la botella` : `${monto} por ml`;
};

const recortarTexto = (t, max) => {
  const limpio = String(t || "").replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  return `${corte.slice(0, corte.lastIndexOf(" "))}…`;
};

/**
 * Todos los perfumes de una casa (para la página de casa), con un resumen y
 * los datos de cada uno (concentración, notas, precio, disponibilidad y el
 * inicio de su descripción). Así cada página de casa tiene contenido propio
 * y no solo una lista de links.
 */
export async function perfumesDeCasaHtml(supabase, nombreCasa) {
  const { data } = await supabase
    .from("parfums")
    .select("id, nombre, casa, stock, precio, concentracion, notas, disponible, descripcion")
    .eq("casa", nombreCasa);
  if (!data?.length) return "";

  const lista = [...data].sort(ordenCatalogo);
  const decants = lista.filter((p) => p.stock !== true);
  const botellas = lista.filter((p) => p.stock === true);
  const disponibles = lista.filter((p) => p.disponible === "Disponible");
  const preciosMl = decants.map((p) => Number(p.precio)).filter((n) => n > 0);

  const partes = [];
  if (decants.length) partes.push(`${decants.length} en decant`);
  if (botellas.length) partes.push(`${botellas.length} en botella`);
  const resumen =
    `<p>En ${esc(SITE_NAME)} tengo ${lista.length} ${
      lista.length === 1 ? "perfume" : "perfumes"
    } de ${esc(nombreCasa)} (${partes.join(" y ")}); ${disponibles.length} ${
      disponibles.length === 1 ? "está disponible" : "están disponibles"
    } hoy.` +
    (preciosMl.length
      ? ` Los decants van desde $${Math.min(...preciosMl).toLocaleString("es-MX")} por ml.`
      : "") +
    "</p>";

  const items = lista
    .map((p) => {
      const datos = [
        p.concentracion,
        precioTexto(p),
        p.disponible,
      ].filter(Boolean);
      const desc = recortarTexto(p.descripcion, 220);
      return (
        `<li><h3><a href="${esc(urlPerfume(p))}">${esc(p.nombre)} (${tipo(p)})</a></h3>` +
        (datos.length ? `<p>${esc(datos.join(" · "))}</p>` : "") +
        (p.notas ? `<p>Notas: ${esc(p.notas)}</p>` : "") +
        (desc ? `<p>${esc(desc)}</p>` : "") +
        "</li>"
      );
    })
    .join("");

  return `<h2>Perfumes de ${esc(nombreCasa)}</h2>${resumen}<ul>${items}</ul>`;
}
