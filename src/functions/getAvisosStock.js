import supabase from "../services/supabase";

/**
 * Crea un aviso de stock (cliente que pide ser avisado cuando llegue un perfume).
 * Llamado desde el form en ProductDetail.
 */
export async function createAvisoStock(aviso) {
  const { data, error } = await supabase
    .from("avisos_stock")
    .insert(aviso)
    .select()
    .single();

  if (error) {
    console.error("Error creating aviso:", error);
    throw error;
  }
  return data;
}

/**
 * Lista todos los avisos. Por default trae todos (pendientes y notificados).
 * Pasa { soloPendientes: true } para filtrar solo los no notificados.
 */
export async function getAvisosStock({ soloPendientes = false } = {}) {
  let query = supabase
    .from("avisos_stock")
    .select("*")
    .order("created_at", { ascending: false });

  if (soloPendientes) {
    query = query.is("notificado_en", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching avisos:", error);
    return [];
  }
  return data || [];
}

/**
 * Marca un aviso como notificado (cuando ya contactaste al cliente por WhatsApp).
 */
export async function marcarAvisoNotificado(id) {
  const { data, error } = await supabase
    .from("avisos_stock")
    .update({ notificado_en: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error marcando aviso:", error);
    throw error;
  }
  return data;
}

/**
 * Vuelve a marcar un aviso como pendiente (por si te equivocaste).
 */
export async function desmarcarAvisoNotificado(id) {
  const { data, error } = await supabase
    .from("avisos_stock")
    .update({ notificado_en: null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error desmarcando aviso:", error);
    throw error;
  }
  return data;
}

/**
 * Borra un aviso definitivamente.
 */
export async function deleteAvisoStock(id) {
  const { error } = await supabase
    .from("avisos_stock")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error borrando aviso:", error);
    throw error;
  }
}