// Recibe el correo del formulario y lo da de alta en EmailOctopus usando la
// API key guardada como variable de entorno (NO se expone al navegador).
// Variables de entorno necesarias en Vercel:
//   EMAILOCTOPUS_API_KEY   -> tu API key (Account > Integrations & API)
//   EMAILOCTOPUS_LIST_ID   -> el ID de tu lista (Lists > tu lista > ajustes)

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

  try {
    const r = await fetch(
      `https://api.emailoctopus.com/lists/${LIST_ID}/contacts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        // status "subscribed" = alta directa. Cambia a "pending" si activas
        // doble opt-in en la lista (envía correo de confirmación).
        body: JSON.stringify({ email_address: email, status: "subscribed" }),
      },
    );

    if (r.ok) return res.status(200).json({ ok: true });

    // Contacto ya existente: lo tratamos como éxito (no es un error real).
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

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
