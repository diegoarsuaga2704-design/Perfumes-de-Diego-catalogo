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
  const [showModal, setShowModal] = useState(false);

  // 🔍 Detección robusta de TikTok o WebView
  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isInAppBrowser =
      /TikTok|Instagram|FBAN|FBAV/i.test(ua) ||
      window.navigator.standalone === false ||
      !window.matchMedia("(display-mode: standalone)").matches;

    // Algunos WebViews no incluyen 'TikTok', pero sí bloquean window.opener
    const isProbablyWebView =
      !window.opener && !document.referrer.includes(window.location.host);

    if (isInAppBrowser || isProbablyWebView) {
      setIsTikTokBrowser(true);
    }
  }, []);

  // 🧾 Mensaje automático
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

  // 🚫 Si el usuario está en TikTok, el botón no redirige — muestra aviso
  const handleCheckoutClick = (e) => {
    if (isTikTokBrowser) {
      e.preventDefault();
      setShowModal(true);
    }
  };

  return (
    <>
      <a
        href={enlaceWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleCheckoutClick}
      >
        <button
          className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] text-white py-2 rounded-md font-medium transition-colors"
          disabled={cartItems.length === 0 || disabled}
        >
          Realizar pedido
        </button>
      </a>

      {/* Modal de aviso elegante */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg max-w-sm p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Abre tu navegador
            </h2>
            <p className="text-gray-600 text-sm mb-5 leading-relaxed">
              Estás usando TikTok u otro navegador interno. Para enviarnos tu
              pedido por WhatsApp, por favor abre esta página en tu navegador
              (Chrome o Safari), ya que TikTok no permite abrir WhatsApp
              directamente.
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
                onClick={() => setShowModal(false)}
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
