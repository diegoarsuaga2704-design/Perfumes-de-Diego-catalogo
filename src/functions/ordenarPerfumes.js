// Orden del catálogo en dos partes que se combinan:
//   ordenCasa:   "az" (default) | "za" | "ninguno" (sin agrupar por casa)
//   ordenDentro: "precio" (menor a mayor, default) | "precioMayor" | "nombre"
// Ej.: casa Z-A + precio mayor a menor.

const texto = (v) => (v ?? "").toString();

/** Compara dos perfumes según el orden elegido (para Array.sort). */
export function compararPerfumes(a, b, ordenCasa = "az", ordenDentro = "precio") {
  if (ordenCasa !== "ninguno") {
    const c = texto(a.casa).localeCompare(texto(b.casa), "es", { sensitivity: "base" });
    if (c !== 0) return ordenCasa === "za" ? -c : c;
  }
  const pa = Number(a.precio) || 0;
  const pb = Number(b.precio) || 0;
  if (ordenDentro === "precio" && pa !== pb) return pa - pb;
  if (ordenDentro === "precioMayor" && pa !== pb) return pb - pa;
  return texto(a.nombre).localeCompare(texto(b.nombre), "es", { sensitivity: "base" });
}
