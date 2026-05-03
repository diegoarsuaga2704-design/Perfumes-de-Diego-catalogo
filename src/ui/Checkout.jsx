import { useCart } from "../context/CartContext";
import { useEffect, useState, useMemo } from "react";
import { calcularPrecioDecantCarrito } from "../functions/pricingDecant";

function Checkout({ totalCartPrice = 0, postalCode = "", disabled = false }) {
  const {
    cartItems = [],
    isDiscountApplied = false,
    subtotal = 0,
    totalWithDiscount = 0,
    discountCode = "",
  } = useCart() || {};

  const [isTikTokBrowser, setIsTikTokBrowser] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/tiktok/i.test(userAgent)) {
      setIsTikTokBrowser(true);
    }
  }, []);

  const safeSubtotal = Number(subtotal) || 0;
  const safeTotalWithDiscount = Number(totalWithDiscount) || 0;
  const safeTotalCartPrice = Number(totalCartPrice) || 0;

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

    return `Hola Diego, me gustaría realizar mi pedido:

${productos}

${resumenPrecio}

Para calcular el costo de envío, este es mi CP: ${postalCode}
Gracias!`;
  }, [
    cartItems,
    isDiscountApplied,
    safeSubtotal,
    safeTotalWithDiscount,
    safeTotalCartPrice,
    discountCode,
    postalCode,
  ]);

  const enlaceWhatsApp = `https://wa.me/5212212034647?text=${encodeURIComponent(
    mensajePedido,
  )}`;

  return (
    <>
      {isTikTokBrowser && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm shadow-lg">
            <h2 className="text-lg font-semibold mb-3">
              ⚠️ Abre esta página en tu navegador
            </h2>
            <p className="mb-4 text-gray-700">
              TikTok no permite abrir WhatsApp desde su navegador interno.
              <br />
              <br />
              1️⃣ Toca los tres puntos arriba a la derecha. <br />
              2️⃣ Selecciona <strong>Abrir en navegador</strong>. <br />
              3️⃣ Luego vuelve a presionar el botón para enviar tu pedido.
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Enlace copiado correctamente.");
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Copiar enlace
            </button>
          </div>
        </div>
      )}

      <a
        href={cartItems.length ? enlaceWhatsApp : "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={`block ${
          isTikTokBrowser ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <button
          className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] text-white py-2 rounded-md font-medium transition-colors"
          disabled={!cartItems.length || disabled}
        >
          Realizar pedido
        </button>
      </a>
    </>
  );
}

export default Checkout;
