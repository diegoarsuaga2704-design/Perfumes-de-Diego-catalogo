// Cálculo del cobro de un pedido, con los precios de la base de datos (no los
// del navegador). Lo usa el servidor antes de crear el pago en Mercado Pago,
// así nadie puede cambiar el precio desde su celular.
//
// Mismas reglas que el carrito: precio por ml de decants (con promos y Ensar
// Oud), botellas por pieza, cupón (validado con validar_cupon) y envío gratis
// cuando los decants, ya con descuento, llegan a $1,950.

import { calcularPrecioDecantCarrito } from "./pricingDecant.js";
import { getEstadoEnvioGratis, COSTO_ENVIO_REGULAR } from "./envioGratis.js";

const ML_DECANT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 30];
const ML_ENSAR_OUD = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const MAX_BOTELLAS = 10;

// Comisión que se suma al pagar en línea (en %). 0 = sin comisión.
export const COMISION_PAGO_LINEA = 0;

const aplicaCupon = (item, target) => {
  if (target === "ALL") return true;
  if (target === "DECANT") return item.tipoVenta === "decant";
  if (target === "BOTELLA") return item.tipoVenta === "botella";
  if (target === "BOTELLA_SELLADA")
    return item.tipoVenta === "botella" && String(item.estado_botella || "").startsWith("Sellado");
  return item.tipoVenta === "decant" && item.casa === target;
};

/**
 * @param {object} p
 * @param {Array} p.items    lo que manda el navegador: { id, tipoVenta, mililitros, cantidad }
 * @param {Array} p.parfums  filas de la tabla parfums con esos ids
 * @param {object|null} p.cupon  resultado de validar_cupon ({ valido, tipo, valor, aplica_a }) o null
 * @returns {{ ok: boolean, error?: string, lineas, subtotal, descuento, envio, comision, total }}
 */
export function calcularCobro({ items = [], parfums = [], cupon = null }) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Tu carrito está vacío." };
  }
  if (items.length > 40) return { ok: false, error: "El pedido tiene demasiados productos." };

  const lineas = [];
  for (const it of items) {
    const fila = parfums.find((p) => Number(p.id) === Number(it?.id));
    if (!fila) return { ok: false, error: "Uno de los perfumes ya no existe. Revisa tu carrito." };
    if (fila.disponible !== "Disponible") {
      return {
        ok: false,
        error: `${fila.nombre} no está disponible para pago en línea. Pídelo por WhatsApp.`,
      };
    }
    const tipoVenta = it.tipoVenta === "botella" ? "botella" : "decant";
    if ((tipoVenta === "botella") !== (fila.stock === true)) {
      return { ok: false, error: `Revisa ${fila.nombre} en tu carrito: cambió su formato.` };
    }

    const base = {
      id: fila.id,
      nombre: fila.nombre,
      casa: fila.casa || null,
      image: fila.image || null,
      tipoVenta,
      precioUnitario: Number(fila.precio) || 0,
      estado_botella: fila.estado_botella || null,
      mlBotella: tipoVenta === "botella" ? fila.mlBotella || null : null,
    };

    if (tipoVenta === "decant") {
      const ml = Number(it.mililitros);
      const permitidos = fila.casa === "Ensar Oud" ? ML_ENSAR_OUD : ML_DECANT;
      if (!permitidos.includes(ml)) {
        return { ok: false, error: `La cantidad de ${fila.nombre} no es válida.` };
      }
      const linea = { ...base, mililitros: ml, cantidad: null };
      linea.subtotal = calcularPrecioDecantCarrito(linea);
      lineas.push(linea);
    } else {
      const cantidad = Number(it.cantidad);
      if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_BOTELLAS) {
        return { ok: false, error: `La cantidad de ${fila.nombre} no es válida.` };
      }
      const linea = { ...base, mililitros: null, cantidad };
      linea.subtotal = linea.precioUnitario * cantidad;
      lineas.push(linea);
    }
  }

  if (lineas.some((l) => !(l.subtotal > 0))) {
    return { ok: false, error: "Uno de los perfumes no tiene precio. Pídelo por WhatsApp." };
  }

  const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);

  let descuento = 0;
  const cuponOk = cupon && cupon.valido;
  if (cuponOk) {
    const descontable = lineas
      .filter((l) => aplicaCupon(l, cupon.aplica_a))
      .reduce((s, l) => s + l.subtotal, 0);
    if (cupon.tipo === "percentage") descuento = (descontable * Number(cupon.valor)) / 100;
    else if (cupon.tipo === "amount") descuento = Math.min(Number(cupon.valor) || 0, descontable);
    descuento = Math.min(Math.max(0, descuento), subtotal);
  }

  const { califica } = getEstadoEnvioGratis({
    cartItems: lineas,
    isDiscountApplied: !!cuponOk,
    discountType: cuponOk ? cupon.tipo : null,
    discountValue: cuponOk ? Number(cupon.valor) : 0,
    discountTarget: cuponOk ? cupon.aplica_a : "ALL",
  });
  const envio = califica ? 0 : COSTO_ENVIO_REGULAR;

  const antesComision = subtotal - descuento + envio;
  const comision = Math.round((antesComision * COMISION_PAGO_LINEA) / 100);
  const total = Math.round((antesComision + comision) * 100) / 100;

  return { ok: true, lineas, subtotal, descuento, envio, comision, total };
}
