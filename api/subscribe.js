// Recibe el correo del formulario, genera un cupón ÚNICO en Supabase y da de
// alta el contacto en EmailOctopus con el cupón en el campo "Cupon". El cupón
// nunca se devuelve al navegador (solo llega por correo). Si el cupón falla por
// lo que sea, la suscripción NO se rompe: se reintenta sin el campo.
//
// Variables de entorno en Vercel:
//   EMAILOCTOPUS_API_KEY   -> API key de EmailOctopus (v2)
//   EMAILOCTOPUS_LIST_ID   -> ID de tu lista
//   SUPABASE_ANON_KEY      -> anon key de Supabase (la misma del frontend)
//   SUPABASE_URL           -> (opcional) URL del proyecto Supabase

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://xpxfacujdaiugphvpili.supabase.co";

const EO_CAMPO_CUPON = "Cupon"; // tag del campo en EmailOctopus
const EO_BASE = "https://api.emailoctopus.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const body =
    typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const email = (body.email || "").trim();
  const hp = body.hp || "";

  if (hp) return res.status(200).json({ ok: true }); // honeypot

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Correo inválido" });
  }

  const API_KEY = process.env.EMAILOCTOPUS_API_KEY;
  const LIST_ID = process.env.EMAILOCTOPUS_LIST_ID;
  if (!API_KEY || !LIST_ID) {
    return res
      .status(500)
      .json({ error: "Falta configuración del servidor (EmailOctopus)" });
  }

  // 1) Cupón (best-effort): si falla, codigo = null y seguimos.
  const codigo = await generarCupon();

  // 2) Alta en EmailOctopus, con el cupón en el campo.
  let r = await crearContacto(LIST_ID, API_KEY, email, codigo);

  // Éxito directo o contacto ya existente.
  if (r.ok || r.status === 409) {
    return res.status(200).json({ ok: true });
  }

  // Si falló y habíamos mandado el campo, reintenta SIN el campo: la
  // suscripción no se debe romper por el cupón.
  if (codigo) {
    const r2 = await crearContacto(LIST_ID, API_KEY, email, null);
    if (r2.ok || r2.status === 409) {
      return res.status(200).json({ ok: true, sinCupon: true });
    }
    r = r2;
  }

  // Diagnóstico (temporal) para ver el motivo real.
  return res.status(502).json({
    error: "No se pudo suscribir",
    eo_status: r.status,
    eo_detalle: r.detalle,
  });
}

async function crearContacto(LIST_ID, API_KEY, email, codigo) {
  const contacto = { email_address: email, status: "subscribed" };
  if (codigo) contacto.fields = { [EO_CAMPO_CUPON]: codigo };
  try {
    const r = await fetch(`${EO_BASE}/lists/${LIST_ID}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(contacto),
    });
    let data = null;
    try {
      data = await r.json();
    } catch {}
    const detalle =
      data?.error?.code || data?.error?.message || data?.code || null;
    return { ok: r.ok, status: r.status, detalle };
  } catch (e) {
    return { ok: false, status: 0, detalle: String(e?.message || e) };
  }
}

async function generarCupon() {
  const ANON = process.env.SUPABASE_ANON_KEY;
  if (!ANON) return null;
  try {
    const cr = await fetch(`${SUPABASE_URL}/rest/v1/rpc/generar_cupon_bienvenida`, {
      method: "POST",
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${ANON}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (!cr.ok) return null;
    const val = await cr.json().catch(() => null);
    return typeof val === "string" ? val : null;
  } catch {
    return null;
  }
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
