import supabase from "../services/supabase";

// Regalos sorpresa del calendario de adviento. Cada código lleva el premio que
// Diego decide; el cliente lo canjea una vez en /calendario-adviento.

// Sin letras que se confundan (O/0, I/1).
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function nuevoCodigo() {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return `NAV-${[...bytes].map((b) => ALFABETO[b % ALFABETO.length]).join("")}`;
}

/** Cliente: canjea su código. Regresa { ok, premio, detalle } o { ok:false, motivo }. */
export async function canjearRegalo(codigo, nombre, telefono) {
  const { data, error } = await supabase.rpc("canjear_regalo_calendario", {
    p_codigo: codigo,
    p_nombre: nombre,
    p_telefono: telefono,
  });
  if (error) throw error;
  return data || { ok: false, motivo: "error" };
}

// ---- Admin ----
export async function getRegalos() {
  const { data, error } = await supabase
    .from("regalos_calendario")
    .select("*")
    .order("created_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

/** Crea `cantidad` códigos nuevos con el mismo premio. */
export async function crearRegalos(cantidad, premio, detalle) {
  const n = Math.max(1, Math.min(200, Number(cantidad) || 1));
  const filas = [];
  const usados = new Set();
  while (filas.length < n) {
    const codigo = nuevoCodigo();
    if (usados.has(codigo)) continue;
    usados.add(codigo);
    filas.push({ codigo, premio: premio.trim(), detalle: detalle?.trim() || null });
  }
  const { data, error } = await supabase.from("regalos_calendario").insert(filas).select();
  if (error) throw error;
  return data || [];
}

export async function actualizarRegalo(codigo, cambios) {
  const { error } = await supabase.from("regalos_calendario").update(cambios).eq("codigo", codigo);
  if (error) throw error;
}

export async function borrarRegalo(codigo) {
  const { error } = await supabase.from("regalos_calendario").delete().eq("codigo", codigo);
  if (error) throw error;
}
