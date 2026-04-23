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
    .eq("disponible", "Disponible")
    .limit(4);

  if (error) {
    console.error("Error fetching relacionados:", error);
    return [];
  }
  return data;
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