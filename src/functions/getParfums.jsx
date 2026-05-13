import supabase from "../services/supabase";

export default async function getParfums() {
  const { data, error } = await supabase.from("parfums").select("*");
  if (error) {
    console.error("Error fetching parfums:", error);
    throw new Error("Could not fetch parfums");
  }
  return data;
}

export async function getParfumById(id) {
  const { data, error } = await supabase
    .from("parfums")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching parfum:", error);
    throw new Error("Could not fetch parfum");
  }
  return data;
}
export async function getBestSellers() {
  const { data, error } = await supabase
    .from("parfums")
    .select("*")
    .eq("esBestSeller", true);

  if (error) {
    console.error("Error fetching best sellers:", error);
    throw new Error("Could not fetch best sellers");
  }
  return data;
}
export async function getRelacionados(casa, excluirId) {
  const { data, error } = await supabase
    .from("parfums")
    .select("*")
    .eq("casa", casa)
    .neq("id", excluirId)
    .eq("disponible", "Disponible");

  if (error) {
    console.error("Error fetching relacionados:", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Shuffle (Fisher-Yates) y limita a 4
  const shuffled = [...data];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 4);
}
export async function getPerfumesConTikTok() {
  const { data, error } = await supabase
    .from("parfums")
    .select("*")
    .not("tiktokLink", "is", null)
    .neq("tiktokLink", "");

  if (error) {
    console.error("Error fetching perfumes con TikTok:", error);
    return [];
  }
  return data;
}