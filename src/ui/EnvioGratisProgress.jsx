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

  // Solo decants cuentan para envío gratis (paquetes ya tienen su propio descuento)
  const subtotalDecants = cartItems
    .filter((item) => item.tipoVenta === "decant")
    .reduce((sum, item) => sum + calcularPrecioDecantCarrito(item), 0);

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

  if (totalDecants === 0) return null;

  const alcanzoEnvioGratis = totalDecants >= UMBRAL_ENVIO_GRATIS;
  const falta = UMBRAL_ENVIO_GRATIS - totalDecants;
  const porcentaje = Math.min((totalDecants / UMBRAL_ENVIO_GRATIS) * 100, 100);

  return (
    <div className="px-6 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-amber-100">
      {alcanzoEnvioGratis ? (
        <p className="text-sm text-green-700 font-semibold text-center mb-2">
          🎉 ¡Tienes envío gratis en tus decants!
        </p>
      ) : (
        <p className="text-sm text-gray-700 text-center mb-2">
          Te faltan{" "}
          <span className="font-bold text-[#A47E3B]">${falta.toFixed(0)}</span>{" "}
          en decants para <span className="font-semibold">envío gratis</span>
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
              Aplica únicamente en decants individuales. No válido en botellas
              completas, parciales ni paquetes (los paquetes ya tienen un
              descuento aplicado).
            </li>
            <li>
              Monto mínimo: ${UMBRAL_ENVIO_GRATIS} en decants individuales.
            </li>
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
