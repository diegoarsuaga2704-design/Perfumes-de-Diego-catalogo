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

  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Mensaje del pedido
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

  // Teléfono en formato internacional sin + — ajusta según tu país
  const phone = "5212212034647";
  const encodedMessage = encodeURIComponent(mensajePedido);

  // Fallbacks
  const waMe = `https://wa.me/${phone}?text=${encodedMessage}`;
  const whatsappScheme = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;
  const androidIntent = `intent://send?text=${encodedMessage}#Intent;package=com.whatsapp;scheme=whatsapp;end`;

  // Detección simple de In-App Browser / WebView
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || "";
    const inApp = /TikTok|Instagram|FBAV|FBAN|Messenger/i.test(ua);
    // heurística adicional para WebView
    const isWebView =
      (/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua) &&
        !/CriOS|FxiOS|EdgiOS/i.test(ua)) ||
      (!window.navigator.standalone &&
        !window.matchMedia("(display-mode: standalone)").matches &&
        !/Chrome|Safari|Firefox/.test(ua));
    if (inApp || isWebView) setIsInAppBrowser(true);
  }, []);

  // Intentamos abrir la app nativa con distintas estrategias
  const tryOpenWhatsApp = () => {
    // Primero intentamos esquema nativo (iOS/otros)
    // y en Android intent://
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    try {
      if (isAndroid) {
        // Intent para Android
        window.location.href = androidIntent;
        // Si falla y el WebView bloquea, después de 1s hacemos fallback
        setTimeout(() => {
          window.location.href = waMe;
        }, 1000);
      } else if (isIOS) {
        // esquema whatsapp para iOS
        window.location.href = whatsappScheme;
        setTimeout(() => {
          // fallback a wa.me si no se abrió
          window.location.href = waMe;
        }, 1000);
      } else {
        // navegador de escritorio u otros navegadores
        window.open(waMe, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      // Fallback directo
      window.open(waMe, "_blank", "noopener,noreferrer");
      console.error(err);
    }
  };

  // Manejador del click del botón principal
  const handleClick = (e) => {
    // Si detectamos WebView (TikTok/IG), evitamos la navegación directa y mostramos modal
    if (isInAppBrowser) {
      e.preventDefault();
      setShowModal(true);
      return;
    }

    // Si no estamos en in-app, intentamos abrir la app directamente
    // (si falla, WhatsApp web se mostrará)
    // No prevenimos aquí, dejamos que el <a> realice su trabajo en navegadores compatibles
  };

  // Copiar al portapapeles
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mensajePedido);
      alert("Mensaje copiado. Abre WhatsApp y pega el texto para enviar.");
    } catch (err) {
      alert(
        "No se pudo copiar automáticamente. Selecciona y copia el texto manualmente."
      );
      console.error(err);
    }
  };

  // Acción del botón "Abrir en navegador"
  const openInBrowser = () => {
    // Forzamos abrir la misma URL en una nueva ventana/pestaña,
    // que en la mayoría de casos hará que se lance el navegador real.
    window.open(window.location.href, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* Enlace normal: wa.me (fallback seguro) */}
      <a
        href={waMe}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        <button
          className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] text-white py-2 rounded-md font-medium transition-colors"
          disabled={cartItems.length === 0 || disabled}
        >
          Realizar pedido
        </button>
      </a>

      {/* Modal que se muestra si estamos en WebView / TikTok */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-lg text-left">
            <h3 className="text-lg font-semibold mb-2">Atención</h3>
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              Parece que estás navegando desde la aplicación de TikTok o desde
              un navegador integrado. En este entorno no siempre es posible
              abrir WhatsApp automáticamente. Tienes estas opciones:
            </p>

            <ul className="list-disc list-inside text-sm text-gray-700 mb-4 space-y-2">
              <li>
                <strong>Abrir en tu navegador (recomendado):</strong> pulsa
                "Abrir en navegador" y luego vuelve a pulsar "Realizar pedido".
              </li>
              <li>
                <strong>Copiar mensaje:</strong> copia el mensaje y pégalo
                manualmente en WhatsApp.
              </li>
              <li>
                <strong>Abrir app ahora:</strong> intentaremos abrir WhatsApp;
                si no funciona, te llevaremos a la página de WhatsApp.
              </li>
            </ul>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  // Intentar abrir la app nativa desde el WebView (puede fallar)
                  tryOpenWhatsApp();
                }}
                className="w-full bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700 transition-colors"
              >
                Abrir WhatsApp ahora
              </button>

              <button
                onClick={() => {
                  copyToClipboard();
                }}
                className="w-full bg-gray-100 text-gray-800 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors"
              >
                Copiar mensaje
              </button>

              <button
                onClick={() => {
                  openInBrowser();
                }}
                className="w-full bg-[#A47E3B] text-white py-2 rounded-md font-medium hover:bg-[#D4AF7A] transition-colors"
              >
                Abrir en navegador
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="w-full text-sm text-gray-500 underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Checkout;
