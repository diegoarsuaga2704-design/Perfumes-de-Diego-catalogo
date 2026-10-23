import supabase from "../services/supabase";
import { avisarPost } from "./avisarBing";

// ---------- Público ----------

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

// Reseña publicada de un perfume (por nombre, para que aparezca tanto en el
// decant como en la botella aunque el post esté vinculado solo a uno).
export async function getPostDePerfume(nombre) {
  if (!nombre) return null;
  const { data, error } = await supabase
    .from("posts")
    .select("slug, titulo, parfums:perfume_id!inner(nombre)")
    .eq("publicado", true)
    .eq("parfums.nombre", nombre)
    .order("creado_en", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching post del perfume:", error);
    return null;
  }
  return data?.[0] || null;
}

// ---------- Admin (requiere is_admin() vía RLS) ----------

// Todos los posts (publicados y borradores), más recientes primero.
export async function getAllPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, titulo, publicado, creado_en")
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("Error fetching posts admin:", error);
    throw error;
  }
  return data;
}

// Un post completo por id (para editar).
export async function getPostById(id) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching post by id:", error);
    throw error;
  }
  return data;
}

// Lista mínima de perfumes para el selector de "perfume vinculado".
export async function getPerfumesMini() {
  const { data, error } = await supabase
    .from("parfums")
    .select("id, nombre, casa")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error fetching perfumes mini:", error);
    return [];
  }
  return data || [];
}

export async function createPost(post) {
  const { data, error } = await supabase
    .from("posts")
    .insert(post)
    .select()
    .single();

  if (error) {
    console.error("Error creando post:", error);
    throw error;
  }
  avisarPost(data); // avisa a Bing si está publicado (no bloquea)
  return data;
}

export async function updatePost(id, updates) {
  const { data, error } = await supabase
    .from("posts")
    .update({ ...updates, actualizado_en: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando post:", error);
    throw error;
  }
  avisarPost(data); // avisa a Bing si está publicado (no bloquea)
  return data;
}

export async function deletePost(id) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    console.error("Error borrando post:", error);
    throw error;
  }
}
