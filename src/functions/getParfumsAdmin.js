import supabase from "../services/supabase";

/**
 * Trae TODOS los perfumes (sin filtrar por disponibilidad).
 * Solo para uso en el panel admin.
 *
 * @returns {Promise<Array>} array de perfumes con todos sus campos
 */
export async function getAllParfumsAdmin() {
  const { data, error } = await supabase
    .from("parfums")
    .select("*")
    .order("casa", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error fetching all parfums (admin):", error);
    throw error;
  }

  return data || [];
}

/**
 * Trae un solo perfume por id (para edición).
 */
export async function getParfumByIdAdmin(id) {
  const { data, error } = await supabase
    .from("parfums")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching parfum by id:", error);
    throw error;
  }

  return data;
}

/**
 * Actualiza un perfume existente.
 *
 * @param {number} id
 * @param {object} updates - solo los campos a actualizar
 */
export async function updateParfumAdmin(id, updates) {
  const { data, error } = await supabase
    .from("parfums")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error updating parfum:", error);
    throw error;
  }

  return data;
}

/**
 * Crea un perfume nuevo.
 */
export async function createParfumAdmin(newParfum) {
  const { data, error } = await supabase
    .from("parfums")
    .insert(newParfum)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error creating parfum:", error);
    throw error;
  }

  return data;
}

/**
 * Borra un perfume.
 */
export async function deleteParfumAdmin(id) {
  const { error } = await supabase.from("parfums").delete().eq("id", id);

  if (error) {
    console.error("Error deleting parfum:", error);
    throw error;
  }

  return true;
}
