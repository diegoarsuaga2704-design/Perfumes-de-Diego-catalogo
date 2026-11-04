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
  const insertar = (fila) => supabase.from("cotizaciones").insert(fila).select().single();
  let { data, error } = await insertar(cotizacion);
  // Si aún no existe la columna tiempo_entrega, guarda sin ella.
  if (error && /tiempo_entrega/.test(error.message || "")) {
    const { tiempo_entrega: _omitir, ...sinTiempo } = cotizacion;
    ({ data, error } = await insertar(sinTiempo));
  }
  if (error) throw error;
  return data;
}

export async function borrarCotizacion(id) {
  const { error } = await supabase.from("cotizaciones").delete().eq("id", id);
  if (error) throw error;
}
