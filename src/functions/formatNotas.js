// Las notas vienen de la base en MAYÚSCULAS ("AMADERADO, DULCE, ÁMBAR").
// Para mostrarlas: cada nota en minúsculas con la primera letra en mayúscula.
export function formatNota(nota) {
  const t = (nota ?? "").toString().trim().toLocaleLowerCase("es-MX");
  return t ? t.charAt(0).toLocaleUpperCase("es-MX") + t.slice(1) : "";
}

// Lista de notas como texto corrido, cada nota con su primera letra en
// mayúscula: "Amaderado, Dulce, Flor de azahar".
export function formatNotasTexto(notas) {
  return (notas ?? "")
    .toString()
    .split(",")
    .map(formatNota)
    .filter(Boolean)
    .join(", ");
}
