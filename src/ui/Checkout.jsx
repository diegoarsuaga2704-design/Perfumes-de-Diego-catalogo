// import { useCart } from "../context/CartContext";

// function Checkout({ totalCartPrice, postalCode, disabled }) {
//   const {
//     cartItems,
//     isDiscountApplied,
//     subtotal,
//     totalWithDiscount,
//     discountCode,
//   } = useCart();

//   const mensajePedido = `Hola Diego, me gustaría realizar mi pedido:
// ${cartItems
//   .map(
//     (item) =>
//       `${item.mililitros} ml de ${item.nombre} ($${item.totalPrice.toFixed(2)})`
//   )
//   .join("\n")}

// ${
//   isDiscountApplied
//     ? `Subtotal: $${subtotal.toFixed(2)}
// Descuento aplicado (${discountCode}): −$${(
//         subtotal - totalWithDiscount
//       ).toFixed(2)}
// Total con descuento: $${totalWithDiscount.toFixed(2)}`
//     : `Total del pedido: $${totalCartPrice.toFixed(2)}`
// }

// Para calcular el costo de envío, este es mi CP: ${postalCode}
// Gracias!`;

//   const enlaceWhatsApp = `https://wa.me/2212034647?text=${encodeURIComponent(
//     mensajePedido
//   )}`;

//   return (
//     <a href={enlaceWhatsApp} target="_blank" rel="noopener noreferrer">
//       <button
//         className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] text-white py-2 rounded-md font-medium"
//         disabled={cartItems.length === 0 || disabled}
//       >
//         Realizar pedido
//       </button>
//     </a>
//   );
// }

// export default Checkout;

import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";

function Checkout({ totalCartPrice, postalCode, disabled }) {
  const {
    cartItems,
    isDiscountApplied,
    subtotal,
    totalWithDiscount,
    discountCode,
  } = useCart();

  const [isTikTokBrowser, setIsTikTokBrowser] = useState(false);

  // 🔍 Detección del navegador interno de TikTok
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/TikTok/i.test(userAgent)) {
      setIsTikTokBrowser(true);
    }
  }, []);

  // 🧾 Mensaje automático de pedido
  const mensajePedido = `Hola Diego, me gustaría realizar mi pedido:
${cartItems
  .map(
    (item) =>
      `${item.mililitros} ml de ${item.nombre} ($${item.totalPrice.toFixed(2)})`
  )
  .join("\n")}

${
  isDiscountApplied
    ? `Subtotal: $${subtotal.toFixed(2)}
Descuento aplicado (${discountCode}): −$${(
        subtotal - totalWithDiscount
      ).toFixed(2)}
Total con descuento: $${totalWithDiscount.toFixed(2)}`
    : `Total del pedido: $${totalCartPrice.toFixed(2)}`
}

Para calcular el costo de envío, este es mi CP: ${postalCode}
Gracias!`;

  const enlaceWhatsApp = `https://wa.me/5212212034647?text=${encodeURIComponent(
    mensajePedido
  )}`;

  return (
    <>
      {/* Botón de realizar pedido */}
      <a href={enlaceWhatsApp} target="_blank" rel="noopener noreferrer">
        <button
          className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] text-white py-2 rounded-md font-medium transition-colors"
          disabled={cartItems.length === 0 || disabled}
        >
          Realizar pedido
        </button>
      </a>

      {/* Modal de advertencia si se abre desde TikTok */}
      {isTikTokBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg max-w-sm p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Estás usando TikTok
            </h2>
            <p className="text-gray-600 text-sm mb-5 leading-relaxed">
              Para poder enviarnos tu pedido por WhatsApp, por favor abre esta
              página en tu navegador (Chrome o Safari). TikTok no permite abrir
              directamente WhatsApp desde su navegador interno.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#A47E3B] text-white py-2 rounded-md font-medium hover:bg-[#D4AF7A] transition-colors"
              >
                Abrir en navegador
              </a>
              <button
                onClick={() => setIsTikTokBrowser(false)}
                className="text-sm text-gray-500 underline hover:text-gray-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Checkout;
