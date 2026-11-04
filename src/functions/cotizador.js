// Cotizador de botellas completas: convierte tu costo en dólares a pesos y
// calcula el precio al cliente de modo que, después de pagar IVA e ISR, te
// quede exactamente costo + ganancia.
//
// Cuentas (precio al cliente = P, ya con IVA incluido):
//   base sin IVA      = P / (1 + IVA)
//   IVA que pagas     = P - base
//   ISR que pagas     = base × ISR
//   te queda          = base - ISR = costo + ganancia
//   => base = (costo + ganancia) / (1 - ISR)   y   P = base × (1 + IVA)

/** Tipo de cambio USD → MXN actualizado (dos fuentes por si una falla). */
export async function getTipoCambio() {
  const fuentes = [
    async () => {
      const r = await fetch("https://open.er-api.com/v6/latest/USD");
      const j = await r.json();
      return { valor: Number(j?.rates?.MXN), fuente: "open.er-api.com", fecha: j?.time_last_update_utc };
    },
    async () => {
      const r = await fetch("https://api.frankfurter.app/latest?from=USD&to=MXN");
      const j = await r.json();
      return { valor: Number(j?.rates?.MXN), fuente: "frankfurter.app", fecha: j?.date };
    },
  ];
  for (const f of fuentes) {
    try {
      const res = await f();
      if (res.valor > 0) return res;
    } catch {
      // probar la siguiente
    }
  }
  return null;
}

/**
 * @param {object} p
 * @param {number} p.costoUsd     lo que te cuesta la botella, en dólares
 * @param {number} p.tipoCambio   pesos por dólar
 * @param {number} p.ganancia     ganancia que quieres, en pesos (si modo "pesos")
 * @param {number} p.gananciaPct  ganancia en % sobre el costo (si modo "porcentaje")
 * @param {"pesos"|"porcentaje"} p.modoGanancia
 * @param {number} p.iva          % de IVA (16)
 * @param {number} p.isr          % de ISR sobre la venta sin IVA
 * @param {number} p.envio        envío en pesos (se suma aparte)
 * El precio siempre termina en $90: se sube a la centena y se le restan
 * $10 (de $3,501 a $3,600 queda en $3,590).
 */
export function calcularCotizacion({
  costoUsd = 0,
  tipoCambio = 0,
  ganancia = 0,
  gananciaPct = 0,
  modoGanancia = "pesos",
  iva = 16,
  isr = 0,
  envio = 0,
}) {
  const costoMxn = (Number(costoUsd) || 0) * (Number(tipoCambio) || 0);
  const gananciaMxn =
    modoGanancia === "porcentaje"
      ? costoMxn * ((Number(gananciaPct) || 0) / 100)
      : Number(ganancia) || 0;
  const tIva = (Number(iva) || 0) / 100;
  const tIsr = (Number(isr) || 0) / 100;

  const neto = costoMxn + gananciaMxn;
  const baseExacta = tIsr < 1 ? neto / (1 - tIsr) : 0;
  const precioExacto = baseExacta * (1 + tIva);
  const precio = precioExacto > 0 ? Math.ceil(precioExacto / 100) * 100 - 10 : 0;

  // Desglose con el precio ya terminado en 90 (puede sumar o restar unos
  // pesos a tu ganancia: como mucho $10 menos).
  const base = precio / (1 + tIva);
  const ivaMxn = precio - base;
  const isrMxn = base * tIsr;
  const teQueda = base - isrMxn;
  const gananciaReal = teQueda - costoMxn;
  const envioMxn = Number(envio) || 0;

  return {
    costoMxn,
    gananciaMxn,
    precio,
    ivaMxn,
    isrMxn,
    teQueda,
    gananciaReal,
    envio: envioMxn,
    total: precio + envioMxn,
  };
}
