import { useState } from "react";
import { useCart } from "../context/CartContext";
import { calcularPrecioDecantCarrito } from "../functions/pricingDecant";

const UMBRAL_ENVIO_GRATIS = 1950;

function EnvioGratisProgress() {
  const {
    cartItems,
    isDiscountApplied,
    discountType,
    discountValue,
    discountTarget,
  } = useCart();
  const [showTerms, setShowTerms] = useState(false);

  // Subtotal de decants (puede recibir descuento)
  const subtotalDecants = cartItems
    .filter((item) => item.tipoVenta === "decant")
    .reduce((sum, item) => sum + calcularPrecioDecantCarrito(item), 0);

  // Subtotal de paquetes (no reciben descuento de cupón)
  const subtotalPaquetes = cartItems
    .filter((item) => item.tipoVenta === "paquete")
    .reduce(
      (sum, item) => sum + (Number(item.precio) || 0) * (item.cantidad || 1),
      0,
    );

  // Aplicar descuento solo a decants
  let totalDecants = subtotalDecants;
  if (
    isDiscountApplied &&
    (discountTarget === "ALL" || discountTarget === "DECANT")
  ) {
    if (discountType === "percentage") {
      totalDecants = subtotalDecants * (1 - discountValue / 100);
    } else if (discountType === "amount") {
      totalDecants = Math.max(0, subtotalDecants - discountValue);
    }
  }

  // Total que cuenta para envío gratis = decants (con descuento) + paquetes
  const totalParaEnvio = totalDecants + subtotalPaquetes;

  if (totalParaEnvio === 0) return null;

  const alcanzoEnvioGratis = totalParaEnvio >= UMBRAL_ENVIO_GRATIS;
  const falta = UMBRAL_ENVIO_GRATIS - totalParaEnvio;
  const porcentaje = Math.min(
    (totalParaEnvio / UMBRAL_ENVIO_GRATIS) * 100,
    100,
  );

  return (
    <div className="px-6 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-amber-100">
      {alcanzoEnvioGratis ? (
        <p className="text-sm text-green-700 font-semibold text-center mb-2">
          🎉 ¡Tienes envío gratis en tu pedido!
        </p>
      ) : (
        <p className="text-sm text-gray-700 text-center mb-2">
          Te faltan{" "}
          <span className="font-bold text-[#A47E3B]">${falta.toFixed(0)}</span>{" "}
          para <span className="font-semibold">envío gratis</span>
        </p>
      )}

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            alcanzoEnvioGratis
              ? "bg-gradient-to-r from-green-400 to-green-600"
              : "bg-gradient-to-r from-[#A47E3B] to-[#D4AF7A]"
          }`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <button
        onClick={() => setShowTerms(!showTerms)}
        className="text-[10px] text-gray-500 hover:text-[#A47E3B] underline mt-1 block mx-auto"
      >
        {showTerms ? "Ocultar términos" : "Ver términos y condiciones"}
      </button>

      {showTerms && (
        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md text-[11px] text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-800 mb-1">
            Términos del envío gratis
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              Aplica en decants y paquetes de decants. No válido en botellas
              completas o parciales.
            </li>
            <li>Monto mínimo: ${UMBRAL_ENVIO_GRATIS} (sin contar botellas).</li>
            <li>
              Válido solo para <strong>zonas regulares de DHL</strong>. No
              aplica en zonas extendidas o de cobertura especial.
            </li>
            <li>
              En caso de zona extendida, se cotizará el envío por WhatsApp al
              finalizar el pedido.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default EnvioGratisProgress;
