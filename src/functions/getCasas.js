import supabase from "../services/supabase";

// Lectura pública: solo casas con imagen (las que aparecen en /casas)
export async function getCasasConImagen() {
  const { data, error } = await supabase
    .from("casas")
    .select("*")
    .not("imagen_hero", "is", null)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error fetching casas:", error);
    throw error;
  }
  return data;
}

// Admin: todas las casas
export async function getAllCasas() {
  const { data, error } = await supabase
    .from("casas")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error fetching todas las casas:", error);
    throw error;
  }
  return data;
}

// Admin: una por id
export async function getCasaById(id) {
  const { data, error } = await supabase
    .from("casas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching casa:", error);
    throw error;
  }
  return data;
}

// Admin: actualizar
export async function updateCasa(id, updates) {
  const { data, error } = await supabase
    .from("casas")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando casa:", error);
    throw error;
  }
  return data;
}

// Conteo de productos disponibles por casa (para mostrar "X items")
export async function getConteoProductosPorCasa() {
  const { data, error } = await supabase
    .from("parfums")
    .select("casa");

  if (error) {
    console.error("Error fetching conteo:", error);
    return {};
  }

  // Agrupa en JS
  const conteo = {};
  data.forEach((p) => {
    if (p.casa) {
      conteo[p.casa] = (conteo[p.casa] || 0) + 1;
    }
  });

  return conteo;
}

/**
 * Asegura que una casa exista en la tabla `casas`. Si no existe, la crea
 * con solo el nombre (sin imagen ni descripción). Si falla, no rompe el
 * flujo del admin: solo loguea el error y devuelve null.
 */
export async function ensureCasaExists(nombreCasa) {
  if (!nombreCasa || !nombreCasa.trim()) return null;
  const nombre = nombreCasa.trim();

  const { data: existing } = await supabase
    .from("casas")
    .select("id")
    .eq("nombre", nombre)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("casas")
    .insert({ nombre })
    .select()
    .single();

  if (error) {
    console.error("Error creando casa automáticamente:", error);
    return null;
  }
  return data;
}

/**
 * Borra una casa de la tabla. Solo se usa cuando no tiene perfumes asociados
 * (el AdminCasasList lo valida antes de mostrar el botón).
 */
export async function deleteCasa(id) {
  const { error } = await supabase.from("casas").delete().eq("id", id);
  if (error) {
    console.error("Error borrando casa:", error);
    throw error;
  }
}