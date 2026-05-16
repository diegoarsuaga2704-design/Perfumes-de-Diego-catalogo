import { useCart } from "../context/CartContext";
import { useEffect, useState, useMemo } from "react";
import { calcularPrecioDecantCarrito } from "../functions/pricingDecant";
import { detectInAppBrowser } from "../functions/detectInAppBrowser";

function Checkout({ totalCartPrice = 0, postalCode = "", disabled = false }) {
  const {
    cartItems = [],
    isDiscountApplied = false,
    subtotal = 0,
    totalWithDiscount = 0,
    discountCode = "",
    ahorroEnPaquetes = 0,
  } = useCart() || {};

  const [inAppInfo, setInAppInfo] = useState({ isInApp: false, source: null });

  useEffect(() => {
    setInAppInfo(detectInAppBrowser());
  }, []);

  const safeSubtotal = Number(subtotal) || 0;
  const safeTotalWithDiscount = Number(totalWithDiscount) || 0;
  const safeTotalCartPrice = Number(totalCartPrice) || 0;
  const safeAhorroEnPaquetes = Number(ahorroEnPaquetes) || 0;

  const mensajePedido = useMemo(() => {
    if (!cartItems.length) return "";

    const productos = cartItems
      .map((item) => {
        const nombre = item?.nombre ?? "Producto";

        if (item.tipoVenta === "botella") {
          const precioTotalItem =
            Number(item.precioUnitario) * Number(item.cantidad);
          return `${nombre} x${item.cantidad} ($${precioTotalItem.toFixed(2)})`;
        }

        if (item.tipoVenta === "decant") {
          const precioTotalItem = calcularPrecioDecantCarrito(item);
          return `${item.mililitros} ml de ${nombre} ($${precioTotalItem.toFixed(
            2,
          )})`;
        }

        if (item.tipoVenta === "paquete") {
          const cantidad = Number(item.cantidad) || 1;
          const precioTotalItem = (Number(item.precio) || 0) * cantidad;
          const cantidadTexto = cantidad > 1 ? ` x${cantidad}` : "";

          // Lista de perfumes incluidos en el paquete
          const contenido =
            item.contenidoInfo && item.contenidoInfo.length > 0
              ? item.contenidoInfo
                  .map(
                    (p) =>
                      `   • ${p.mililitros} ml de ${p.nombre} (${p.casa})`,
                  )
                  .join("\n")
              : "";

          return `📦 ${nombre}${cantidadTexto} ($${precioTotalItem.toFixed(2)})${
            contenido ? "\n" + contenido : ""
          }`;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");

    const resumenPrecio = isDiscountApplied
      ? `Subtotal: $${safeSubtotal.toFixed(2)}
Descuento aplicado (${discountCode}): −$${(
          safeSubtotal - safeTotalWithDiscount
        ).toFixed(2)}
Total con descuento: $${safeTotalWithDiscount.toFixed(2)}`
      : `Total del pedido: $${safeTotalCartPrice.toFixed(2)}`;

    const lineaAhorro =
      safeAhorroEnPaquetes > 0
        ? `\nAhorro por comprar en paquete: $${safeAhorroEnPaquetes.toFixed(2)}`
        : "";

    return `Hola Diego, me gustaría realizar mi pedido:

${productos}

${resumenPrecio}${lineaAhorro}

Para calcular el costo de envío, este es mi CP: ${postalCode}
Gracias!`;
  }, [
    cartItems,
    isDiscountApplied,
    safeSubtotal,
    safeTotalWithDiscount,
    safeTotalCartPrice,
    safeAhorroEnPaquetes,
    discountCode,
    postalCode,
  ]);

  const enlaceWhatsApp = `https://wa.me/5212212034647?text=${encodeURIComponent(
    mensajePedido,
  )}`;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!cartItems.length || disabled || inAppInfo.isInApp) return;
          window.open(enlaceWhatsApp, "_blank", "noopener,noreferrer");
        }}
        disabled={!cartItems.length || disabled || inAppInfo.isInApp}
        className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] active:bg-[#8B6A30] text-white py-2 rounded-md font-medium transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        Realizar pedido
      </button>
    </>
  );
}

export default Checkout;
