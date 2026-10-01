import { calcularPrecioDecantCarrito } from "./pricingDecant";

export const UMBRAL_ENVIO_GRATIS = 1950;

/**
 * Fuente ÚNICA de la lógica de envío gratis.
 * Solo suman los decants individuales.
 *
 * @returns {object} {
 *   total,          monto elegible (ya con descuento aplicado)
 *   califica,       si alcanza el envío gratis
 *   falta,          cuánto falta para el umbral
 *   porcentaje,     avance 0-100 para la barra
 *   hayElegibles,   el carrito trae decants que suman
 * }
 */
export function getEstadoEnvioGratis({
  cartItems = [],
  isDiscountApplied = false,
  discountType = null,
  discountValue = 0,
  discountTarget = "ALL",
} = {}) {
  const elegibles = cartItems.filter((i) => i.tipoVenta === "decant");

  const subtotal = elegibles.reduce(
    (sum, item) => sum + calcularPrecioDecantCarrito(item),
    0,
  );

  // Parte de los decants a la que aplica el cupón: todos (ALL / DECANT) o
  // solo los de una casa (cupón por casa). Los cupones de botellas no cuentan.
  let descontable = 0;
  if (isDiscountApplied) {
    if (discountTarget === "ALL" || discountTarget === "DECANT") {
      descontable = subtotal;
    } else if (discountTarget !== "BOTELLA" && discountTarget !== "BOTELLA_SELLADA") {
      descontable = elegibles
        .filter((i) => i.casa === discountTarget)
        .reduce((sum, item) => sum + calcularPrecioDecantCarrito(item), 0);
    }
  }

  let total = subtotal;
  if (descontable > 0) {
    if (discountType === "percentage") {
      total = subtotal - (descontable * discountValue) / 100;
    } else if (discountType === "amount") {
      total = subtotal - Math.min(discountValue, descontable);
    }
  }

  return {
    total,
    califica: subtotal > 0 && total >= UMBRAL_ENVIO_GRATIS,
    falta: Math.max(0, UMBRAL_ENVIO_GRATIS - total),
    porcentaje: Math.min((total / UMBRAL_ENVIO_GRATIS) * 100, 100),
    hayElegibles: elegibles.length > 0,
  };
}
