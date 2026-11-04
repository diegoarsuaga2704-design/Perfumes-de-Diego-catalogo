import supabase from "../services/supabase";

// Cotizaciones de botellas guardadas desde /admin/cotizador.

export async function getCotizaciones() {
  const { data, error } = await supabase
    .from("cotizaciones")
    .select("*")
    .order("created_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function guardarCotizacion(cotizacion) {
  const { data, error } = await supabase
    .from("cotizaciones")
    .insert(cotizacion)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function borrarCotizacion(id) {
  const { error } = await supabase.from("cotizaciones").delete().eq("id", id);
  if (error) throw error;
}
