// Formatea un número como precio en pesos mexicanos con separadores de miles.
// formatPrecio(1950) -> "1,950" ; formatPrecio(1950.5, 2) -> "1,950.50"
export function formatPrecio(n, decimals = 0) {
  const num = Number(n) || 0;
  return num.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
