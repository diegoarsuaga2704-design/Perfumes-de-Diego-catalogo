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

const KEY_PREGUNTAR = "pedido_preguntar_enviado";

function Checkout({ totalCartPrice = 0, postalCode = "" }) {
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
  // Tras intentar mandar el pedido (abrir WhatsApp o copiarlo) se pregunta si
  // ya lo envió. Solo al confirmar se vacía el carrito y se usa el cupón.
  // Se guarda en sessionStorage: si WhatsApp abre su página web y el cliente
  // regresa con "atrás", la página se recarga y la pregunta debe seguir ahí.
  const [preguntarEnviado, setPreguntarEnviadoState] = useState(() => {
    try {
      return sessionStorage.getItem(KEY_PREGUNTAR) === "1";
    } catch {
      return false;
    }
  });
  const setPreguntarEnviado = (v) => {
    setPreguntarEnviadoState(v);
    try {
      if (v) sessionStorage.setItem(KEY_PREGUNTAR, "1");
      else sessionStorage.removeItem(KEY_PREGUNTAR);
    } catch {
      // sin sessionStorage
    }
  };
  const [noSeAbrio, setNoSeAbrio] = useState(false);

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

    const cpValido = String(postalCode).trim().length === 5;
    const lineaCP = cpValido
      ? `Para calcular el costo de envío, este es mi CP: ${postalCode}`
      : `Te paso mi código postal por aquí para calcular el envío.`;

    return `Hola Diego, me gustaría realizar mi pedido:

${productos}

${resumenPrecio}

${lineaCP}
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

  // Lo único que impide pedir es un carrito vacío. El código postal es
  // opcional: si no lo ponen, se acuerda por WhatsApp.
  const noListo = !cartItems.length;

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
    setNoSeAbrio(false);
    setPreguntarEnviado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const navigate = useNavigate();

  // Marca el cupón de bienvenida como usado al enviar el pedido por WhatsApp
  // (sin importar si paga). Solo aplica a los códigos de bienvenida (BIENVENIDA).
  // OJO: supabase.rpc() no es una Promise real y NO tiene .catch(); hay que
  // esperarlo con await dentro de try/catch, o la llamada nunca se ejecuta.
  const marcarCuponUsado = async () => {
    if (!isDiscountApplied || !discountCode) return;
    if (!discountCode.toUpperCase().startsWith("BIENVENIDA")) return;
    try {
      await supabase.rpc("marcar_cupon_usado", { p_codigo: discountCode });
    } catch (e) {
      console.error("No se pudo marcar el cupón como usado:", e);
    }
    borrarCupon();
  };

  // Cuando el cliente confirma que ya envió el pedido: marca el cupón como
  // usado, vacía el carrito y regresa al catálogo.
  const [confirmando, setConfirmando] = useState(false);
  const confirmarEnviado = async () => {
    if (confirmando) return;
    setConfirmando(true);
    track("pedido_confirmado", { total: safeTotalCartPrice });
    await marcarCuponUsado();
    setPreguntarEnviado(false);
    vaciarCarrito();
    closeCart();
    navigate("/home");
  };

  // Abrir WhatsApp NO vacía el carrito: si la app (TikTok/Instagram) o el
  // navegador lo bloquea, el cliente no pierde su pedido ni su cupón.
  const intentarAbrirWhatsApp = () => {
    track("pedido_whatsapp_intento", { total: safeTotalCartPrice });
    setNoSeAbrio(false);
    setPreguntarEnviado(true);
    // location.href abre WhatsApp en más casos que window.open dentro de apps.
    window.location.href = enlaceWhatsApp;
  };

  const preguntaEnviado = preguntarEnviado && (
    <div className="mt-3 rounded-md border border-[#A47E3B] bg-white p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-2">
        ¿Ya enviaste tu pedido por WhatsApp?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirmarEnviado}
          disabled={confirmando}
          className="flex-1 py-2 rounded-md font-semibold bg-[#A47E3B] text-white hover:bg-[#D4AF7A] active:bg-[#8B6A30] disabled:opacity-60"
        >
          Sí, ya lo envié
        </button>
        <button
          type="button"
          onClick={() => {
            track("pedido_no_se_abrio");
            setPreguntarEnviado(false);
            setNoSeAbrio(true);
          }}
          className="flex-1 py-2 rounded-md font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          No se abrió
        </button>
      </div>
    </div>
  );

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

            {preguntaEnviado && <div className="mb-3">{preguntaEnviado}</div>}

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

            {noSeAbrio && (
              <p className="mt-2 text-xs text-gray-600">
                Tu carrito sigue aquí. Usa la opción 1 o 2 de arriba.
              </p>
            )}

            {trustLine}
          </>

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
          setNoSeAbrio(false);
          setPreguntarEnviado(true);
        }}
        disabled={noListo}
        className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] active:bg-[#8B6A30] text-white py-2 rounded-md font-medium transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        Enviar pedido por WhatsApp
      </button>
      {preguntaEnviado}
      {noSeAbrio && (
        <p className="mt-2 text-xs text-gray-600">
          Tu carrito sigue aquí. Toca de nuevo el botón o escríbeme al{" "}
          <span className="font-semibold whitespace-nowrap">+52 221 203 4647</span>.
        </p>
      )}
      {trustLine}
    </div>
  );
}

export default Checkout;
