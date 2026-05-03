import supabase from "../services/supabase";

/**
 * Trae TODOS los paquetes para el admin (incluye inactivos).
 * Ordenados por el campo `orden` ascendente.
 */
export async function getAllPaquetesAdmin() {
  const { data, error } = await supabase
    .from("paquetes")
    .select("*")
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching paquetes (admin):", error);
    throw error;
  }

  return data || [];
}

/**
 * Trae un paquete por id (para edición).
 */
export async function getPaqueteByIdAdmin(id) {
  const { data, error } = await supabase
    .from("paquetes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching paquete by id:", error);
    throw error;
  }

  return data;
}

/**
 * Crea un paquete nuevo.
 */
export async function createPaqueteAdmin(newPaquete) {
  const { data, error } = await supabase
    .from("paquetes")
    .insert(newPaquete)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error creating paquete:", error);
    throw error;
  }

  return data;
}

/**
 * Actualiza un paquete existente.
 */
export async function updatePaqueteAdmin(id, updates) {
  const { data, error } = await supabase
    .from("paquetes")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error updating paquete:", error);
    throw error;
  }

  return data;
}

/**
 * Borra un paquete.
 */
export async function deletePaqueteAdmin(id) {
  const { error } = await supabase.from("paquetes").delete().eq("id", id);

  if (error) {
    console.error("Error deleting paquete:", error);
    throw error;
  }

  return true;
}

/**
 * Trae paquetes públicos: solo activos Y donde TODOS sus perfumes
 * están en estado "Disponible". Si algún perfume está agotado o
 * próximamente, el paquete se pausa automáticamente.
 *
 * Devuelve cada paquete con un campo extra "perfumesInfo" con los
 * detalles de cada perfume incluido.
 */
export async function getPaquetesPublicos() {
  // 1. Traer paquetes activos
  const { data: paquetes, error: errPaquetes } = await supabase
    .from("paquetes")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (errPaquetes) {
    console.error("Error fetching paquetes públicos:", errPaquetes);
    throw errPaquetes;
  }

  if (!paquetes || paquetes.length === 0) return [];

  // 2. Recolectar todos los parfumIds usados en los paquetes
  const allParfumIds = new Set();
  paquetes.forEach((p) => {
    (p.contenido || []).forEach((item) => {
      if (item.parfumId) allParfumIds.add(item.parfumId);
    });
  });

  if (allParfumIds.size === 0) {
    // Paquete sin contenido, lo devolvemos pero sin perfumesInfo
    return paquetes.map((p) => ({ ...p, perfumesInfo: [] }));
  }

  // 3. Traer todos los perfumes mencionados
  const { data: parfums, error: errParfums } = await supabase
    .from("parfums")
    .select("id, nombre, casa, disponible, image, precio")
    .in("id", Array.from(allParfumIds));

  if (errParfums) {
    console.error("Error fetching parfums for paquetes:", errParfums);
    throw errParfums;
  }

  const parfumsById = {};
  (parfums || []).forEach((p) => {
    parfumsById[p.id] = p;
  });

  // 4. Filtrar paquetes: solo los que tengan TODOS sus perfumes "Disponible"
  const paquetesValidos = paquetes
    .map((paquete) => {
      const items = paquete.contenido || [];
      const perfumesInfo = items
        .map((item) => {
          const parfum = parfumsById[item.parfumId];
          if (!parfum) return null;
          return {
            ...parfum,
            mililitros: item.mililitros,
          };
        })
        .filter(Boolean);

      // Pausar si algún perfume no está disponible
      const todosDisponibles = perfumesInfo.every(
        (p) => p.disponible === "Disponible",
      );

      // Pausar también si falta info de algún perfume
      const todosEncontrados = perfumesInfo.length === items.length;

      if (!todosDisponibles || !todosEncontrados) return null;

      return { ...paquete, perfumesInfo };
    })
    .filter(Boolean);

  return paquetesValidos;
}
