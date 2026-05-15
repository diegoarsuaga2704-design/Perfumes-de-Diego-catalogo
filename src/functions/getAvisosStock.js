import supabase from "../services/supabase";

/**
 * Crea un aviso de stock (cliente que pide ser avisado cuando llegue un perfume).
 * Llamado desde el form en ProductDetail.
 */
export async function createAvisoStock(aviso) {
  const { error } = await supabase.from("avisos_stock").insert(aviso);

  if (error) {
    console.error("Error creating aviso:", error);
    throw error;
  }
  return true;
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

/**
 * Marca un aviso como leído (Diego lo vio pero todavía no ha contactado al cliente).
 */
export async function marcarAvisoLeido(id) {
  const { data, error } = await supabase
    .from("avisos_stock")
    .update({ leido_en: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error marcando aviso como leído:", error);
    throw error;
  }
  return data;
}

/**
 * Devuelve un aviso al estado "Nuevo" (sin leer).
 */
export async function desmarcarAvisoLeido(id) {
  const { data, error } = await supabase
    .from("avisos_stock")
    .update({ leido_en: null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error desmarcando como leído:", error);
    throw error;
  }
  return data;
}

/**
 * Cuenta cuántos avisos están en estado "Nuevo" (sin leer ni notificar).
 * Se usa en el AdminPanel para mostrar el badge.
 */
export async function getCountAvisosNuevos() {
  const { count, error } = await supabase
    .from("avisos_stock")
    .select("*", { count: "exact", head: true })
    .is("leido_en", null)
    .is("notificado_en", null);

  if (error) {
    console.error("Error contando avisos nuevos:", error);
    return 0;
  }
  return count || 0;
}