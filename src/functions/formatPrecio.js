// Formatea un número como precio en pesos mexicanos con separadores de miles.
// formatPrecio(1950) -> "1,950.00" ; formatPrecio(200, 0) -> "200"
export function formatPrecio(n, decimals = 2) {
  const num = Number(n) || 0;
  return num.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
