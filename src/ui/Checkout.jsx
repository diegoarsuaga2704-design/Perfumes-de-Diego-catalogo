import { useCart } from "../context/CartContext";
import { useEffect, useState, useMemo } from "react";
import { calcularPrecioDecantCarrito } from "../functions/pricingDecant";
import { detectInAppBrowser } from "../functions/detectInAppBrowser";
import { track } from "@vercel/analytics";
import { CheckCircle } from "lucide-react";

function Checkout({ totalCartPrice = 0, postalCode = "", disabled = false }) {
  const {
    cartItems = [],
    isDiscountApplied = false,
    subtotal = 0,
    totalWithDiscount = 0,
    discountCode = "",
  } = useCart() || {};

  const [inAppInfo, setInAppInfo] = useState({ isInApp: false, source: null });
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setInAppInfo(detectInAppBrowser());
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

  // No se puede pedir todavía: carrito vacío o CP inválido (disabled lo envía
  // el carrito según el código postal).
  const noListo = !cartItems.length || disabled;

  const copiarTexto = async (texto) => {
    // 1) API moderna (necesita contexto seguro; a veces bloqueada en in-app)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
        return true;
      }
    } catch {
      // cae al método de respaldo
    }
    // 2) Respaldo: textarea + execCommand (funciona en más navegadores in-app)
    try {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, texto.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopiar = async () => {
    const ok = await copiarTexto(mensajePedido);
    if (!ok) return;
    track("pedido_copiar", { total: safeTotalCartPrice });
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // Navegador interno de TikTok/Instagram/Facebook: window.open y a veces los
  // deep-links de WhatsApp fallan. En vez de dejar el botón gris y mudo, le
  // damos al usuario un camino claro: enlace directo, copiar pedido e
  // instrucción para abrir en el navegador real.
  if (inAppInfo.isInApp) {
    const navTarget = inAppInfo.platform === "ios" ? "Safari" : "Chrome";
    const puntos = inAppInfo.platform === "ios" ? "(···)" : "(⋮)";

    return (
      <div className="rounded-md border border-[#A47E3B]/40 bg-[#FBF7F0] p-4 text-sm text-gray-700">
        {disabled ? (
          <p className="text-gray-700">
            Ingresa tu código postal arriba para continuar con tu pedido.
          </p>
        ) : (
          <>
            <p className="font-semibold text-gray-900 mb-3">
              Desde {inAppInfo.source || "aquí"} no se abre WhatsApp solo. Tienes
              dos formas:
            </p>

            <p className="font-medium text-gray-900">
              Opción 1 (recomendada): ábrela en {navTarget}
            </p>
            <p className="mb-3">
              Toca los 3 puntitos {puntos} arriba a la derecha → “Abrir en{" "}
              {navTarget}”. Ahí el botón de pedido funciona normal.
            </p>

            <p className="font-medium text-gray-900">Opción 2: copia tu pedido</p>
            <p className="mb-2">
              Cópialo y mándamelo por WhatsApp al{" "}
              <span className="font-semibold whitespace-nowrap">
                +52 221 203 4647
              </span>
              .
            </p>

            <button
              type="button"
              onClick={handleCopiar}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-md font-medium transition-colors ${
                copiado
                  ? "bg-green-600 text-white animate-[copiadoPop_0.4s_ease]"
                  : "border border-[#A47E3B] text-[#A47E3B] hover:bg-[#A47E3B]/10"
              }`}
            >
              {copiado ? (
                <>
                  <CheckCircle size={18} />
                  ¡Pedido copiado!
                </>
              ) : (
                "Copiar mi pedido"
              )}
            </button>

            {copiado && (
              <p className="mt-2 text-xs text-green-700">
                Listo. Abre WhatsApp y pega tu pedido en el chat con Diego.
              </p>
            )}
          </>
        )}

        <style>{`
          @keyframes copiadoPop {
            0% { transform: scale(0.96); }
            50% { transform: scale(1.04); }
            100% { transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (noListo) return;
        track("pedido_whatsapp", { total: safeTotalCartPrice });
        window.open(enlaceWhatsApp, "_blank", "noopener,noreferrer");
      }}
      disabled={noListo}
      className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] active:bg-[#8B6A30] text-white py-2 rounded-md font-medium transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
    >
      Enviar pedido por WhatsApp
    </button>
  );
}

export default Checkout;
