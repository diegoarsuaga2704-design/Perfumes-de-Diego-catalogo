import supabase from "../services/supabase";

// Lectura pública: muestra aleatoria de testimonios destacados
export async function getTestimoniosDestacados(limit = 6) {
  // Trae todos los destacados (Supabase no tiene RANDOM() nativo en el client)
  const { data, error } = await supabase
    .from("testimonios")
    .select("*")
    .eq("destacado", true);

  if (error) {
    console.error("Error fetching testimonios destacados:", error);
    throw error;
  }

  if (!data || data.length === 0) return [];

  // Shuffle (Fisher-Yates) y corta al límite
  const shuffled = [...data];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, limit);
}

// Admin: trae todos
export async function getAllTestimonios() {
  const { data, error } = await supabase
    .from("testimonios")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching todos los testimonios:", error);
    throw error;
  }
  return data;
}

// Admin: trae uno por id
export async function getTestimonioById(id) {
  const { data, error } = await supabase
    .from("testimonios")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching testimonio:", error);
    throw error;
  }
  return data;
}

// Admin: crear
export async function createTestimonio(testimonio) {
  const { data, error } = await supabase
    .from("testimonios")
    .insert([testimonio])
    .select()
    .single();

  if (error) {
    console.error("Error creando testimonio:", error);
    throw error;
  }
  return data;
}

// Admin: actualizar
export async function updateTestimonio(id, updates) {
  const { data, error } = await supabase
    .from("testimonios")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando testimonio:", error);
    throw error;
  }
  return data;
}

// Admin: borrar
export async function deleteTestimonio(id) {
  const { error } = await supabase
    .from("testimonios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando testimonio:", error);
    throw error;
  }
  return true;
}