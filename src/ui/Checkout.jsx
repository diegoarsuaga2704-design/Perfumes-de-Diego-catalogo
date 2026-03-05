// import { useCart } from "../context/CartContext";
// import { useEffect, useState } from "react";

// function Checkout({ totalCartPrice, postalCode, disabled }) {
//   const {
//     cartItems,
//     isDiscountApplied,
//     subtotal,
//     totalWithDiscount,
//     discountCode,
//   } = useCart();

//   const [isTikTokBrowser, setIsTikTokBrowser] = useState(false);

//   useEffect(() => {
//     const userAgent = navigator.userAgent || navigator.vendor || window.opera;
//     if (/tiktok/i.test(userAgent)) {
//       setIsTikTokBrowser(true);
//     }
//   }, []);

//   const mensajePedido = `Hola Diego, me gustaría realizar mi pedido:
// ${cartItems
//   .map(
//     (item) =>
//       `${item.mililitros} ml de ${item.nombre} ($${item.totalPrice.toFixed(2)})`,
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

//   const enlaceWhatsApp = `https://wa.me/5212212034647?text=${encodeURIComponent(
//     mensajePedido,
//   )}`;

//   return (
//     <>
//       {isTikTokBrowser && (
//         <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-6 z-50">
//           <div className="bg-white rounded-2xl p-6 max-w-sm shadow-lg">
//             <h2 className="text-lg font-semibold mb-3">
//               ⚠️ Abre esta página en tu navegador
//             </h2>
//             <p className="mb-4 text-gray-700">
//               TikTok no permite abrir WhatsApp directamente desde su navegador
//               interno. Para completar tu pedido:
//               <br />
//               <br />
//               1️⃣ Toca los tres puntos arriba a la derecha. <br />
//               2️⃣ Selecciona <strong>“Abrir en navegador”</strong>. <br />
//               3️⃣ Una vez abierta la página en Safari o Chrome, vuelve a tocar el
//               botón para enviar tu pedido por WhatsApp.
//             </p>
//             <button
//               onClick={() => {
//                 navigator.clipboard.writeText(window.location.href);
//                 alert(
//                   "Enlace copiado. Pégalo en tu navegador si lo prefieres.",
//                 );
//               }}
//               className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
//             >
//               Copiar enlace
//             </button>
//           </div>
//         </div>
//       )}

//       <a
//         href={enlaceWhatsApp}
//         target="_blank"
//         rel="noopener noreferrer"
//         className={`block ${
//           isTikTokBrowser ? "pointer-events-none opacity-50" : ""
//         }`}
//       >
//         <button
//           className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] text-white py-2 rounded-md font-medium transition-colors"
//           disabled={cartItems.length === 0 || disabled}
//         >
//           Realizar pedido
//         </button>
//       </a>
//     </>
//   );
// }

// export default Checkout;

import { useCart } from "../context/CartContext";
import { useEffect, useState, useMemo } from "react";

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

  // Normalizamos valores numéricos
  const safeSubtotal = Number(subtotal) || 0;
  const safeTotalWithDiscount = Number(totalWithDiscount) || 0;
  const safeTotalCartPrice = Number(totalCartPrice) || 0;

  //   const mensajePedido = useMemo(() => {
  //     if (!cartItems.length) return "";

  //     const productos = cartItems
  //       .map((item) => {
  //         const nombre = item?.nombre ?? "Producto";

  //         // Detectamos si es decant (con mililitros) o botella completa
  //         const mililitros = Number(item?.mililitros);
  //         const quantity = Number(item?.quantity) || 1;

  //         // Intentamos obtener precio unitario correctamente
  //         const price =
  //           Number(item?.price) ||
  //           Number(item?.precio) ||
  //           Number(item?.unitPrice) ||
  //           0;

  //         // Si existe totalPrice lo usamos como respaldo
  //         const fallbackTotal = Number(item?.totalPrice) || 0;

  //         const precioTotalItem = price > 0 ? price * quantity : fallbackTotal;

  //         // Construcción inteligente de descripción
  //         const descripcion =
  //           mililitros > 0 ? `${mililitros} ml de ${nombre}` : `${nombre}`;

  //         return `${descripcion} ($${precioTotalItem.toFixed(2)})`;
  //       })
  //       .join("\n");

  //     const resumenPrecio = isDiscountApplied
  //       ? `Subtotal: $${safeSubtotal.toFixed(2)}
  // Descuento aplicado (${discountCode}): −$${(
  //           safeSubtotal - safeTotalWithDiscount
  //         ).toFixed(2)}
  // Total con descuento: $${safeTotalWithDiscount.toFixed(2)}`
  //       : `Total del pedido: $${safeTotalCartPrice.toFixed(2)}`;

  //     return `Hola Diego, me gustaría realizar mi pedido:

  // ${productos}

  // ${resumenPrecio}

  // Para calcular el costo de envío, este es mi CP: ${postalCode}
  // Gracias!`;
  //   }, [
  //     cartItems,
  //     isDiscountApplied,
  //     safeSubtotal,
  //     safeTotalWithDiscount,
  //     safeTotalCartPrice,
  //     discountCode,
  //     postalCode,
  //   ]);
  const mensajePedido = useMemo(() => {
    if (!cartItems.length) return "";

    const productos = cartItems
      .map((item) => {
        const nombre = item?.nombre ?? "Producto";

        let precioTotalItem = 0;

        if (item.tipoVenta === "botella") {
          precioTotalItem = Number(item.precioUnitario) * Number(item.cantidad);

          return `${nombre} x${item.cantidad} ($${precioTotalItem.toFixed(2)})`;
        }

        if (item.tipoVenta === "decant") {
          precioTotalItem =
            Number(item.precioUnitario) * Number(item.mililitros);

          return `${item.mililitros} ml de ${nombre} ($${precioTotalItem.toFixed(
            2,
          )})`;
        }

        return "";
      })
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
