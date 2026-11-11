// Crea el cobro de un pedido en Mercado Pago (Checkout Pro) y regresa el link
// de pago. El precio se calcula AQUÍ con los precios de Supabase; lo que manda
// el navegador solo dice qué perfumes y cuántos ml o piezas.
//
// Variables de entorno en Vercel:
//   MP_ACCESS_TOKEN            -> Access Token de Mercado Pago (producción)
//   SUPABASE_SERVICE_ROLE_KEY  -> service_role key de Supabase (solo servidor)
//   VITE_SUPABASE_URL          -> (ya existe) URL del proyecto Supabase

import { createClient } from "@supabase/supabase-js";
import { calcularCobro } from "../src/functions/cobro.js";

const SITE_URL = "https://perfumesdediego.com";
const NUMERO_VALIDO = /^([0-9]{1,9}|PD-[A-Z0-9]{6,10})$/;
// Estados en los que el pedido todavía se puede cobrar.
const COBRABLES = ["en_checkout", "enviado", "pago_pendiente"];

const limpiar = (v, max = 120) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

function leerCliente(c = {}) {
  const cliente = {
    nombre: limpiar(c.nombre, 80),
    telefono: limpiar(c.telefono, 20).replace(/[^\d+]/g, ""),
    email: limpiar(c.email, 120).toLowerCase(),
    calle: limpiar(c.calle, 120),
    colonia: limpiar(c.colonia, 80),
    ciudad: limpiar(c.ciudad, 80),
    estado: limpiar(c.estado, 60),
    cp: limpiar(c.cp, 5).replace(/\D/g, ""),
    referencias: limpiar(c.referencias, 200),
  };
  if (cliente.nombre.length < 3) return { error: "Escribe tu nombre completo." };
  if (cliente.telefono.replace(/\D/g, "").length < 10) return { error: "Escribe tu WhatsApp a 10 dígitos." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) return { error: "Escribe un correo válido." };
  if (cliente.calle.length < 4) return { error: "Escribe tu calle y número." };
  if (cliente.colonia.length < 2) return { error: "Escribe tu colonia." };
  if (cliente.ciudad.length < 2) return { error: "Escribe tu ciudad o municipio." };
  if (cliente.estado.length < 2) return { error: "Escribe tu estado." };
  if (cliente.cp.length !== 5) return { error: "Escribe tu código postal a 5 dígitos." };
  return { cliente };
}

export default async function handler(req, res) {
  const TOKEN = process.env.MP_ACCESS_TOKEN;
  const SB_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Interruptor: sin VITE_PAGO_LINEA=1 no se cobra nada aunque haya claves.
  const ENCENDIDO = process.env.VITE_PAGO_LINEA === "1";

  // GET: la tienda pregunta si el pago en línea ya está configurado.
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "s-maxage=300");
    return res.status(200).json({ activo: !!(ENCENDIDO && TOKEN && SB_URL && SB_KEY) });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  if (!ENCENDIDO) {
    return res.status(503).json({ error: "El pago en línea todavía no está activo. Pídelo por WhatsApp." });
  }
  if (!TOKEN || !SB_URL || !SB_KEY) {
    return res.status(503).json({ error: "El pago en línea todavía no está activo. Pídelo por WhatsApp." });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const numero = String(body.numero || "").toUpperCase();
  if (!NUMERO_VALIDO.test(numero)) return res.status(400).json({ error: "Pedido inválido. Recarga la página." });

  const { cliente, error: errCliente } = leerCliente(body.cliente);
  if (errCliente) return res.status(400).json({ error: errCliente });

  const items = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
  const ids = [...new Set(items.map((i) => Number(i?.id)).filter(Number.isFinite))];

  const supabase = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

  try {
    // ¿El pedido ya se pagó o lo moviste tú de estado? Entonces no se cobra otra vez.
    const { data: previo, error: errPrevio } = await supabase
      .from("pedidos_web")
      .select("estado")
      .eq("numero", numero)
      .maybeSingle();
    if (errPrevio) throw errPrevio;
    if (previo && !COBRABLES.includes(previo.estado)) {
      return res.status(409).json({ error: "Este pedido ya se registró. Recarga la página para hacer uno nuevo.", nuevoNumero: true });
    }

    const { data: parfums, error: errParfums } = await supabase.from("parfums").select("*").in("id", ids.length ? ids : [-1]);
    if (errParfums) throw errParfums;

    let cupon = null;
    const codigo = limpiar(body.codigo, 40).toUpperCase();
    if (codigo) {
      const { data: v } = await supabase.rpc("validar_cupon", { p_codigo: codigo });
      cupon = v?.[0]?.valido ? v[0] : null;
    }

    const cobro = calcularCobro({ items, parfums: parfums || [], cupon });
    if (!cobro.ok) return res.status(400).json({ error: cobro.error });

    // Guarda el pedido con lo calculado aquí (esto es lo que vale).
    const fila = {
      numero,
      estado: "pago_pendiente",
      metodo: "mercadopago",
      items: cobro.lineas,
      subtotal: cobro.subtotal,
      descuento: cobro.descuento,
      codigo_descuento: cupon ? codigo : null,
      envio: cobro.envio,
      total: cobro.total,
      codigo_postal: cliente.cp,
      cliente,
      updated_at: new Date().toISOString(),
    };
    const { error: errGuardar } = await supabase.from("pedidos_web").upsert(fila, { onConflict: "numero" });
    if (errGuardar) throw errGuardar;

    const descripcion = cobro.lineas
      .map((l) => (l.tipoVenta === "botella" ? `${l.nombre} x${l.cantidad}` : `${l.nombre} ${l.mililitros} ml`))
      .join(", ")
      .slice(0, 250);

    const [nombre, ...apellidos] = cliente.nombre.split(/\s+/);
    const preferencia = {
      items: [
        {
          id: numero,
          title: `Pedido #${numero} · Perfumes de Diego`,
          description: descripcion,
          quantity: 1,
          currency_id: "MXN",
          unit_price: cobro.total,
        },
      ],
      payer: {
        name: nombre,
        surname: apellidos.join(" ") || undefined,
        email: cliente.email,
        phone: { number: cliente.telefono },
      },
      external_reference: numero,
      metadata: { numero },
      notification_url: `${SITE_URL}/api/mp-webhook`,
      back_urls: {
        success: `${SITE_URL}/pago?n=${encodeURIComponent(numero)}&r=ok`,
        pending: `${SITE_URL}/pago?n=${encodeURIComponent(numero)}&r=pendiente`,
        failure: `${SITE_URL}/pago?n=${encodeURIComponent(numero)}&r=error`,
      },
      auto_return: "approved",
      statement_descriptor: "PERFUMESDIEGO",
    };

    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(preferencia),
    });
    const mp = await r.json().catch(() => ({}));
    if (!r.ok || !mp.init_point) {
      console.error("Mercado Pago no creó la preferencia:", r.status, mp);
      return res.status(502).json({ error: "No se pudo abrir Mercado Pago. Intenta de nuevo o pídelo por WhatsApp." });
    }

    return res.status(200).json({ ok: true, url: mp.init_point, total: cobro.total });
  } catch (e) {
    console.error("Error creando el pago:", e);
    return res.status(500).json({ error: "No se pudo preparar el pago. Intenta de nuevo o pídelo por WhatsApp." });
  }
}
