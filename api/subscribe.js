// Recibe el correo del formulario, genera un cupón ÚNICO de bienvenida en
// Supabase y da de alta el contacto en EmailOctopus con el cupón en un campo
// personalizado. El cupón NUNCA se devuelve al navegador: solo llega por correo
// (la automatización de bienvenida lo inserta con su merge tag). Así un correo
// falso no recibe el descuento.
//
// Variables de entorno en Vercel:
//   EMAILOCTOPUS_API_KEY   -> API key de EmailOctopus
//   EMAILOCTOPUS_LIST_ID   -> ID de tu lista
//   SUPABASE_ANON_KEY      -> anon key de Supabase (la misma del frontend)
//   SUPABASE_URL           -> (opcional) URL del proyecto Supabase

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://xpxfacujdaiugphvpili.supabase.co";

// Tag del campo personalizado en EmailOctopus donde guardamos el cupón.
const EO_CAMPO_CUPON = "Cupon";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const body =
    typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const email = (body.email || "").trim();
  const hp = body.hp || "";

  // Honeypot anti-bot: si viene lleno, fingimos éxito y no hacemos nada.
  if (hp) return res.status(200).json({ ok: true });

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Correo inválido" });
  }

  const API_KEY = process.env.EMAILOCTOPUS_API_KEY;
  const LIST_ID = process.env.EMAILOCTOPUS_LIST_ID;
  if (!API_KEY || !LIST_ID) {
    return res.status(500).json({ error: "Falta configuración del servidor" });
  }

  // 1) Genera el cupón único en Supabase. Si falla, igual suscribimos (sin cupón).
  const codigo = await generarCupon();

  // 2) Da de alta el contacto en EmailOctopus con el cupón en el campo.
  try {
    const contacto = { email_address: email, status: "subscribed" };
    if (codigo) contacto.fields = { [EO_CAMPO_CUPON]: codigo };

    const r = await fetch(
      `https://api.emailoctopus.com/lists/${LIST_ID}/contacts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(contacto),
      },
    );

    if (r.ok) return res.status(200).json({ ok: true });

    // Contacto ya existente: lo tratamos como éxito (ya tuvo su cupón antes).
    const data = await r.json().catch(() => ({}));
    const code = String(data?.error?.code || data?.code || "");
    if (r.status === 409 || /CONFLICT|EXIST/i.test(code)) {
      return res.status(200).json({ ok: true, yaExistia: true });
    }

    return res.status(502).json({ error: "No se pudo suscribir" });
  } catch {
    return res.status(502).json({ error: "Error de red" });
  }
}

// Llama a la función generar_cupon_bienvenida de Supabase. Devuelve el código
// o null si algo falla (no rompemos el alta por esto).
async function generarCupon() {
  const ANON = process.env.SUPABASE_ANON_KEY;
  if (!ANON) return null;
  try {
    const cr = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/generar_cupon_bienvenida`,
      {
        method: "POST",
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${ANON}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    );
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
