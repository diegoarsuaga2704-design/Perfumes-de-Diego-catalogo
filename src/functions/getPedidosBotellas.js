import supabase from "../services/supabase";

export async function getAllPedidosBotellas() {
  const { data, error } = await supabase
    .from("pedidos_botellas")
    .select(`
      *,
      proveedor:proveedores(id, nombre),
      cliente:clientes_admin(id, nombre, es_propio)
    `)
    .order("fecha", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false });
  if (error) {
    console.error("Error fetching pedidos:", error);
    return [];
  }
  return data || [];
}

export async function updatePedidoBotella(id, updates) {
  const payload = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value === "" || value === undefined) {
      payload[key] = null;
    } else {
      payload[key] = value;
    }
  }
  const { data, error } = await supabase
    .from("pedidos_botellas")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createPedidoBotella(payload) {
  const clean = {};
  for (const [key, value] of Object.entries(payload)) {
    clean[key] = value === "" || value === undefined ? null : value;
  }
  // perfume_nombre es NOT NULL en el schema
  if (!clean.perfume_nombre) clean.perfume_nombre = "(sin nombre)";
  const { data, error } = await supabase
    .from("pedidos_botellas")
    .insert([clean])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePedidoBotella(id) {
  const { error } = await supabase.from("pedidos_botellas").delete().eq("id", id);
  if (error) throw error;
}

// Recalcula buy_total, revenue y margin_pct a partir de los inputs.
// Devuelve un objeto con SOLO los campos calculados (para mergear con updates).
export function recalcularDependientes(fila, field, value) {
  const merged = { ...fila, [field]: value };
  const buy_mxn = Number(merged.buy_mxn) || 0;
  const importing = Number(merged.importing) || 0;
  const sell = Number(merged.sell) || 0;
  const calc = {};

  if (field === "buy_mxn" || field === "importing") {
    calc.buy_total = buy_mxn + importing;
  }
  const newBuyTotal = calc.buy_total !== undefined ? calc.buy_total : Number(merged.buy_total) || 0;

  if (
    field === "buy_mxn" ||
    field === "importing" ||
    field === "sell"
  ) {
    if (sell > 0 && newBuyTotal > 0) {
      calc.revenue = sell - newBuyTotal;
      calc.margin_pct = (calc.revenue / newBuyTotal) * 100;
    } else if (sell > 0) {
      calc.revenue = sell;
      calc.margin_pct = null;
    } else {
      calc.revenue = null;
      calc.margin_pct = null;
    }
  }
  return calc;
}