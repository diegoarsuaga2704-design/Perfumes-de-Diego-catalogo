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

import { useCart } from "../context/CartContext";
import { useEffect, useState } from "react";

function Checkout({ totalCartPrice, postalCode, disabled }) {
  const {
    cartItems,
    isDiscountApplied,
    subtotal,
    totalWithDiscount,
    discountCode,
  } = useCart();

  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/tiktok/i.test(userAgent)) {
      setShowWarning(true);
    }
  }, []);

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

  const abrirEnNavegador = () => {
    // Intenta abrir la misma página fuera de TikTok
    const url = window.location.href;
    window.open(url, "_blank");
  };

  return (
    <>
      {/* --- Pantalla de advertencia si está dentro de TikTok --- */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm shadow-lg">
            <h2 className="text-lg font-semibold mb-3">
              ⚠️ Abre tu pedido en tu navegador
            </h2>
            <p className="mb-4 text-gray-700">
              TikTok bloquea el acceso directo a WhatsApp. Por favor abre esta
              página en tu navegador (Safari o Chrome) para poder enviar tu
              pedido correctamente.
            </p>
            <button
              onClick={abrirEnNavegador}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Abrir en navegador
            </button>
          </div>
        </div>
      )}

      {/* --- Botón de WhatsApp (solo si no está en TikTok) --- */}
      <a
        href={enlaceWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        className={`block ${
          showWarning ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <button
          className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] text-white py-2 rounded-md font-medium transition-colors"
          disabled={cartItems.length === 0 || disabled}
        >
          Realizar pedido
        </button>
      </a>
    </>
  );
}

export default Checkout;
