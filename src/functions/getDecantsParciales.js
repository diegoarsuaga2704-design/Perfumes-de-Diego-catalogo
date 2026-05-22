import supabase from "../services/supabase";

/**
 * Lista todos los decants y parciales con join al cliente.
 */
export async function getAllDecantsParciales() {
  const { data, error } = await supabase
    .from("decants_parciales")
    .select(
      `
      *,
      clientes_admin:cliente_id ( id, nombre, es_propio )
    `,
    )
    .order("fecha", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

/**
 * Crea un nuevo decant/parcial. Devuelve la fila completa con join al cliente.
 */
export async function createDecantParcial(payload = {}) {
  const { data, error } = await supabase
    .from("decants_parciales")
    .insert([payload])
    .select(
      `
      *,
      clientes_admin:cliente_id ( id, nombre, es_propio )
    `,
    )
    .single();

  if (error) throw error;
  return data;
}

/**
 * Actualiza un decant/parcial. Devuelve la fila completa con join.
 */
export async function updateDecantParcial(id, updates) {
  const { data, error } = await supabase
    .from("decants_parciales")
    .update(updates)
    .eq("id", id)
    .select(
      `
      *,
      clientes_admin:cliente_id ( id, nombre, es_propio )
    `,
    )
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDecantParcial(id) {
  const { error } = await supabase
    .from("decants_parciales")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
