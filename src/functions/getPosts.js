import supabase from "../services/supabase";

// Lista pública: solo posts publicados, más recientes primero.
export async function getPostsPublicados() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, titulo, extracto, imagen, creado_en")
    .eq("publicado", true)
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
  return data;
}

// Un post por slug (solo si está publicado). Incluye el perfume vinculado.
export async function getPostBySlug(slug) {
  const { data, error } = await supabase
    .from("posts")
    .select("*, parfums:perfume_id (id, nombre, casa, image)")
    .eq("slug", slug)
    .eq("publicado", true)
    .maybeSingle();

  if (error) {
    console.error("Error fetching post:", error);
    throw error;
  }
  return data;
}
