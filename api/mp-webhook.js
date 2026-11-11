// Aviso de Mercado Pago cuando cambia un pago. No confiamos en lo que trae el
// aviso: con el id le preguntamos a Mercado Pago el estado real del pago y
// solo entonces marcamos el pedido como pagado.
//
// Variables de entorno en Vercel: MP_ACCESS_TOKEN, SUPABASE_SERVICE_ROLE_KEY,
// VITE_SUPABASE_URL (las mismas que api/mp-crear-pago.js).

import { createClient } from "@supabase/supabase-js";

// Estados que ya no se tocan desde aquí (los cambias tú en el admin).
const FINALES = ["entregado", "cancelado"];

function idDePago(req) {
  const q = req.query || {};
  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const tipo = q.type || q.topic || body.type || body.topic || "";
  if (tipo && tipo !== "payment") return null;
  const id = q["data.id"] || body?.data?.id || q.id || (tipo === "payment" ? body.resource : null);
  const limpio = String(id || "").replace(/\D/g, "");
  return limpio || null;
}

export default async function handler(req, res) {
  const TOKEN = process.env.MP_ACCESS_TOKEN;
  const SB_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!TOKEN || !SB_URL || !SB_KEY) return res.status(200).json({ ok: false, motivo: "sin configurar" });

  const id = idDePago(req);
  if (!id) return res.status(200).json({ ok: true, ignorado: true });

  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (!r.ok) {
      console.error("No se pudo leer el pago", id, r.status);
      // 500 para que Mercado Pago vuelva a intentar más tarde.
      return res.status(500).json({ ok: false });
    }
    const pago = await r.json();
    const numero = String(pago.external_reference || "").toUpperCase();
    if (!numero) return res.status(200).json({ ok: true, ignorado: true });

    const supabase = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
    const { data: pedido, error } = await supabase
      .from("pedidos_web")
      .select("numero, estado, total, codigo_descuento, pago")
      .eq("numero", numero)
      .maybeSingle();
    if (error) throw error;
    if (!pedido) return res.status(200).json({ ok: true, ignorado: true });

    const datosPago = {
      id: String(pago.id),
      estado: pago.status,
      detalle: pago.status_detail || null,
      monto: Number(pago.transaction_amount) || 0,
      metodo: pago.payment_method_id || null,
      tipo: pago.payment_type_id || null,
      fecha: pago.date_approved || pago.date_created || null,
    };

    const cambios = { pago: datosPago, updated_at: new Date().toISOString() };
    const pagoCompleto = pago.status === "approved" && datosPago.monto + 0.5 >= Number(pedido.total);

    if (!FINALES.includes(pedido.estado)) {
      if (pagoCompleto) cambios.estado = "pagado";
      else if (pago.status === "approved") cambios.estado = "pago_pendiente"; // pagó menos: lo revisas tú
      else if (["pending", "in_process", "authorized"].includes(pago.status)) cambios.estado = "pago_pendiente";
      // rechazado / cancelado: el pedido se queda como está para que pueda reintentar
    }

    const { error: errUpd } = await supabase.from("pedidos_web").update(cambios).eq("numero", numero);
    if (errUpd) throw errUpd;

    // Cupón de bienvenida: se marca como usado al pagarse (igual que al
    // confirmar por WhatsApp). Solo la primera vez que llega el pago.
    const yaEstabaPagado = pedido.pago?.estado === "approved";
    if (pagoCompleto && !yaEstabaPagado && String(pedido.codigo_descuento || "").startsWith("BIENVENIDA")) {
      try {
        await supabase.rpc("marcar_cupon_usado", { p_codigo: pedido.codigo_descuento });
      } catch (e) {
        console.error("No se pudo marcar el cupón:", e);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Error en el aviso de Mercado Pago:", e);
    return res.status(500).json({ ok: false });
  }
}
