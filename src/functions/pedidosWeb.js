import supabase from "../services/supabase";

// Pedidos hechos desde la tienda. Cada carrito en el checkout tiene un número
// consecutivo (desde 1777) que va en el mensaje de WhatsApp; solo se consulta
// en el admin. Si Supabase no responde, se usa un código PD-XXXXXX de respaldo.

export const ESTADOS_PEDIDO = {
  en_checkout: { texto: "En checkout (no lo envió)", cliente: "Sin enviar", color: "bg-gray-100 text-gray-700" },
  enviado: { texto: "Abrió WhatsApp", cliente: "Recibido", color: "bg-blue-100 text-blue-700" },
  confirmado: { texto: "Confirmó envío", cliente: "Recibido", color: "bg-amber-100 text-amber-800" },
  pagado: { texto: "Pagado", cliente: "Pagado", color: "bg-green-100 text-green-700" },
  entregado: { texto: "Enviado / entregado", cliente: "Enviado", color: "bg-emerald-100 text-emerald-800" },
  cancelado: { texto: "Cancelado", cliente: "Cancelado", color: "bg-red-100 text-red-700" },
};

const KEY_ACTUAL = "pedido_numero_actual";
// Sin letras que se confundan (O/0, I/1).
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function nuevoNumero() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `PD-${[...bytes].map((b) => ALFABETO[b % ALFABETO.length]).join("")}`;
}

const leerActual = () => {
  try {
    return sessionStorage.getItem(KEY_ACTUAL);
  } catch {
    return null;
  }
};

let pidiendo = null;

/**
 * Número del pedido que se está armando (el mismo hasta que se confirme).
 * Lo da Supabase en orden: 1777, 1778, ...
 */
export function numeroPedidoActual() {
  const guardado = leerActual();
  if (guardado && /^\d+$/.test(guardado)) return Promise.resolve(guardado);
  if (pidiendo) return pidiendo;
  pidiendo = (async () => {
    let n = null;
    try {
      const { data, error } = await supabase.rpc("nuevo_numero_pedido");
      if (!error && data) n = String(data);
    } catch {
      // sin red o sin la función en Supabase
    }
    if (!n) n = guardado || nuevoNumero();
    try {
      sessionStorage.setItem(KEY_ACTUAL, n);
    } catch {
      // sin sessionStorage
    }
    return n;
  })().finally(() => {
    pidiendo = null;
  });
  return pidiendo;
}

export function olvidarNumeroActual() {
  try {
    sessionStorage.removeItem(KEY_ACTUAL);
  } catch {
    // sin sessionStorage
  }
}

/** Guarda o actualiza el pedido en Supabase (no truena si falla). */
export async function registrarPedidoWeb(numero, datos) {
  try {
    await supabase.rpc("registrar_pedido_web", { p_numero: numero, p_datos: datos });
  } catch (e) {
    console.error("No se pudo registrar el pedido:", e);
  }
}

/**
 * Guarda el pedido con su estado: "enviado" (tocó Enviar pedido) o
 * "confirmado" (dijo que ya lo envió). Usa fetch con keepalive para que se
 * complete aunque el navegador salga a WhatsApp en ese momento.
 */
export function marcarPedidoWeb(numero, estado, datos) {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    fetch(`${url}/rest/v1/rpc/registrar_pedido_web`, {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_numero: numero, p_datos: { ...datos, estado } }),
    }).catch(() => {});
  } catch {
    // sin red
  }
}

// ---- Admin ----
export async function getPedidosWeb() {
  const { data, error } = await supabase
    .from("pedidos_web")
    .select("*")
    .order("created_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function cambiarEstadoPedidoWeb(numero, estado) {
  const { error } = await supabase
    .from("pedidos_web")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("numero", numero);
  if (error) throw error;
}
