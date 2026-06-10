import supabase from "../services/supabase";

export async function getCodigosDescuento() {
  const { data, error } = await supabase
    .from("codigos_descuento")
    .select("*")
    .order("creado_en", { ascending: false, nullsFirst: false });
  if (error) {
    console.error("Error fetching codigos:", error);
    return [];
  }
  return data;
}

function normalizar(form) {
  return {
    codigo: form.codigo.trim().toUpperCase(),
    tipo: form.tipo,
    valor: Number(form.valor),
    aplica_a: form.aplica_a,
    activo: !!form.activo,
    expira: form.expira ? form.expira : null,
    usos_maximos:
      form.usos_maximos === "" || form.usos_maximos == null
        ? null
        : Number(form.usos_maximos),
  };
}

export async function createCodigo(form) {
  const { data, error } = await supabase
    .from("codigos_descuento")
    .insert([normalizar(form)])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCodigo(id, form) {
  const { data, error } = await supabase
    .from("codigos_descuento")
    .update(normalizar(form))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCodigo(id) {
  const { error } = await supabase
    .from("codigos_descuento")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
