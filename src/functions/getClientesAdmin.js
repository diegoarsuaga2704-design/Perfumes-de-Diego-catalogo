import supabase from "../services/supabase";

export async function getClientesConStats() {
  const { data: clientes, error } = await supabase
    .from("clientes_admin")
    .select("*")
    .order("nombre");
  if (error) {
    console.error("Error fetching clientes:", error);
    return [];
  }

  const { data: pedidos, error: err2 } = await supabase
    .from("pedidos_botellas")
    .select("cliente_id, sell")
    .not("cliente_id", "is", null);

  const { data: decants, error: err3 } = await supabase
    .from("decants_parciales")
    .select("cliente_id, monto")
    .not("cliente_id", "is", null);

  if (err2 || err3) {
    console.error("Error fetching stats:", err2 || err3);
  }

  const stats = {};
  (pedidos || []).forEach((p) => {
    if (!stats[p.cliente_id])
      stats[p.cliente_id] = { botellas: 0, decants: 0, total: 0 };
    stats[p.cliente_id].botellas++;
    if (p.sell) stats[p.cliente_id].total += Number(p.sell);
  });
  (decants || []).forEach((d) => {
    if (!stats[d.cliente_id])
      stats[d.cliente_id] = { botellas: 0, decants: 0, total: 0 };
    stats[d.cliente_id].decants++;
    if (d.monto) stats[d.cliente_id].total += Number(d.monto);
  });

  return clientes.map((c) => ({
    ...c,
    cantidad_botellas: stats[c.id]?.botellas || 0,
    cantidad_decants: stats[c.id]?.decants || 0,
    total_comprado: stats[c.id]?.total || 0,
  }));
}

export async function createClienteAdmin({ nombre, whatsapp, notas, es_propio }) {
  const { data, error } = await supabase
    .from("clientes_admin")
    .insert([
      {
        nombre: nombre.trim(),
        whatsapp: whatsapp?.trim() || null,
        notas: notas?.trim() || null,
        es_propio: !!es_propio,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClienteAdmin(id, updates) {
  const payload = {
    nombre: updates.nombre.trim(),
    whatsapp: updates.whatsapp?.trim() || null,
    notas: updates.notas?.trim() || null,
    es_propio: !!updates.es_propio,
  };
  const { data, error } = await supabase
    .from("clientes_admin")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClienteAdmin(id) {
  const { error } = await supabase.from("clientes_admin").delete().eq("id", id);
  if (error) throw error;
}