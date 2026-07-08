import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { calcularPrecioDecantCarrito } from "../functions/pricingDecant";
import { detectInAppBrowser } from "../functions/detectInAppBrowser";
import { formatPrecio } from "../functions/formatPrecio";
import { track } from "@vercel/analytics";
import { CheckCircle } from "lucide-react";
import supabase from "../services/supabase";
import { borrarCupon } from "../functions/cuponBienvenida";

function Checkout({ totalCartPrice = 0, postalCode = "", disabled = false }) {
  const {
    cartItems = [],
    isDiscountApplied = false,
    subtotal = 0,
    totalWithDiscount = 0,
    discountCode = "",
    vaciarCarrito = () => {},
    closeCart = () => {},
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
          return `${nombre} x${item.cantidad} ($${formatPrecio(precioTotalItem)})`;
        }

        if (item.tipoVenta === "decant") {
          const precioTotalItem = calcularPrecioDecantCarrito(item);
          return `${item.mililitros} ml de ${nombre} ($${formatPrecio(
            precioTotalItem,
          )})`;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");

    const resumenPrecio = isDiscountApplied
      ? `Subtotal: $${formatPrecio(safeSubtotal)}
Descuento aplicado (${discountCode}): −$${formatPrecio(
          safeSubtotal - safeTotalWithDiscount,
        )}
Total con descuento: $${formatPrecio(safeTotalWithDiscount)}`
      : `Total del pedido: $${formatPrecio(safeTotalCartPrice)}`;

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

  const navigate = useNavigate();

  // Marca el cupón de bienvenida como usado al enviar el pedido por WhatsApp
  // (sin importar si paga). Solo aplica a los códigos de bienvenida (BIENVENIDA).
  const marcarCuponUsado = () => {
    if (!isDiscountApplied || !discountCode) return;
    if (!discountCode.toUpperCase().startsWith("BIENVENIDA")) return;
    supabase.rpc("marcar_cupon_usado", { p_codigo: discountCode }).catch(() => {});
    borrarCupon();
  };

  // Tras enviar el pedido: marca el cupón como usado, vacía el carrito y cierra
  // el panel. El mensaje de WhatsApp ya se abrió con el pedido actual.
  const finalizarPedido = () => {
    marcarCuponUsado();
    vaciarCarrito();
    closeCart();
  };

  // Intento directo en navegador in-app: location.href abre WhatsApp en más
  // casos que window.open (que suele bloquearse). Si no abre, quedan los pasos.
  const intentarAbrirWhatsApp = () => {
    track("pedido_whatsapp_intento", { total: safeTotalCartPrice });
    finalizarPedido();
    window.location.href = enlaceWhatsApp;
  };

  const trustLine = (
    <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-500">
      Productos 100% originales · Envío por DHL · Pago seguro
    </p>
  );

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
              Envía tu pedido por WhatsApp:
            </p>

            <button
              type="button"
              onClick={intentarAbrirWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-semibold bg-[#A47E3B] text-white hover:bg-[#D4AF7A] active:bg-[#8B6A30] transition-colors mb-3"
            >
              Abrir WhatsApp
            </button>

            <p className="text-gray-700 mb-3">
              ¿No se abrió? A veces {inAppInfo.source || "el navegador de la app"}{" "}
              lo bloquea. Usa una de estas:
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

            {trustLine}
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
    <div>
      <button
        type="button"
        onClick={() => {
          if (noListo) return;
          track("pedido_whatsapp", { total: safeTotalCartPrice });
          window.open(enlaceWhatsApp, "_blank", "noopener,noreferrer");
          finalizarPedido();
          navigate("/home");
        }}
        disabled={noListo}
        className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] active:bg-[#8B6A30] text-white py-2 rounded-md font-medium transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        Enviar pedido por WhatsApp
      </button>
      {trustLine}
    </div>
  );
}

export default Checkout;
