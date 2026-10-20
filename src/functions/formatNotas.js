// Las notas vienen de la base en MAYÚSCULAS ("AMADERADO, DULCE, ÁMBAR").
// Para mostrarlas: cada nota en minúsculas con la primera letra en mayúscula.
export function formatNota(nota) {
  const t = (nota ?? "").toString().trim().toLocaleLowerCase("es-MX");
  return t ? t.charAt(0).toLocaleUpperCase("es-MX") + t.slice(1) : "";
}

// Lista de notas como texto corrido: "Amaderado, dulce, ámbar".
export function formatNotasTexto(notas) {
  const lista = (notas ?? "")
    .toString()
    .split(",")
    .map((n) => n.trim().toLocaleLowerCase("es-MX"))
    .filter(Boolean);
  if (lista.length === 0) return "";
  lista[0] = formatNota(lista[0]);
  return lista.join(", ");
}
