import supabase from "../services/supabase";

export async function getProveedoresConConteo() {
  const { data: proveedores, error } = await supabase
    .from("proveedores")
    .select("*")
    .order("nombre");
  if (error) {
    console.error("Error fetching proveedores:", error);
    return [];
  }

  const { data: pedidos, error: err2 } = await supabase
    .from("pedidos_botellas")
    .select("proveedor_id");
  if (err2) {
    console.error("Error fetching counts:", err2);
    return proveedores.map((p) => ({ ...p, cantidad_pedidos: 0 }));
  }

  const counts = {};
  pedidos.forEach((p) => {
    if (p.proveedor_id) counts[p.proveedor_id] = (counts[p.proveedor_id] || 0) + 1;
  });

  return proveedores.map((p) => ({
    ...p,
    cantidad_pedidos: counts[p.id] || 0,
  }));
}

export async function createProveedor({ nombre, notas }) {
  const { data, error } = await supabase
    .from("proveedores")
    .insert([{ nombre: nombre.trim(), notas: notas?.trim() || null }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProveedor(id, updates) {
  const payload = {
    nombre: updates.nombre.trim(),
    notas: updates.notas?.trim() || null,
  };
  const { data, error } = await supabase
    .from("proveedores")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProveedor(id) {
  const { error } = await supabase.from("proveedores").delete().eq("id", id);
  if (error) throw error;
}