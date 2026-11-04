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
  let fila = { ...cotizacion };
  let { data, error } = await insertar(fila);
  // Si aún no existe alguna columna nueva (tiempo_entrega, casa), guarda sin ella.
  for (const col of ["tiempo_entrega", "casa", "tiempo_entrega"]) {
    if (error && new RegExp(col).test(error.message || "")) {
      delete fila[col];
      ({ data, error } = await insertar(fila));
    }
  }
  if (error) throw error;
  return data;
}

export async function borrarCotizacion(id) {
  const { error } = await supabase.from("cotizaciones").delete().eq("id", id);
  if (error) throw error;
}

// Listas administrables del cotizador (proveedores_cotizador, casas_cotizador).
// Son independientes de la tienda: agregar una casa aquí no la agrega al catálogo.
export async function getListaCotizador(tabla) {
  const { data, error } = await supabase
    .from(tabla)
    .select("id, nombre")
    .order("nombre", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function agregarAListaCotizador(tabla, nombre) {
  const { data, error } = await supabase
    .from(tabla)
    .insert({ nombre })
    .select("id, nombre")
    .single();
  if (error) throw error;
  return data;
}

export async function borrarDeListaCotizador(tabla, id) {
  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) throw error;
}
