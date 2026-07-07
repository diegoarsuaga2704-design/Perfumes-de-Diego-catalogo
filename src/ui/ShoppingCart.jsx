import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { X, ArrowLeft, ShoppingBag } from "lucide-react";
import ShoppingCartProduct from "./ShoppingCartProduct";
import EnvioGratisProgress from "./EnvioGratisProgress";
import Checkout from "./Checkout";
import { detectInAppBrowser } from "../functions/detectInAppBrowser";
import { formatPrecio } from "../functions/formatPrecio";
import { calcularPrecioDecantCarrito } from "../functions/pricingDecant";
import { track } from "@vercel/analytics";
import { useState, useEffect } from "react";

export default function ShoppingCart() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    subtotal,
    totalWithDiscount,
    discountCode,
    applyDiscountCode,
    isDiscountApplied,
    discountType,
    discountValue,
    discountTarget,
    errorMessage,
    setErrorMessage,
  } = useCart();

  const [postalCode, setPostalCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [paso, setPaso] = useState("carrito"); // "carrito" | "cp" | "pedido"
  const [inApp, setInApp] = useState(false);
  const navigate = useNavigate();

  // ¿Los decants del carrito ya califican a envío gratis? Mismo cálculo que la
  // barra de progreso, para que el mensaje del total no se contradiga con ella.
  const UMBRAL_ENVIO_GRATIS = 1950;
  const subtotalDecants = cartItems
    .filter((i) => i.tipoVenta === "decant")
    .reduce((s, i) => s + calcularPrecioDecantCarrito(i), 0);
  let totalDecants = subtotalDecants;
  if (
    isDiscountApplied &&
    (discountTarget === "ALL" || discountTarget === "DECANT")
  ) {
    if (discountType === "percentage")
      totalDecants = subtotalDecants * (1 - discountValue / 100);
    else if (discountType === "amount")
      totalDecants = Math.max(0, subtotalDecants - discountValue);
  }
  const decantsCalifican =
    subtotalDecants > 0 && totalDecants >= UMBRAL_ENVIO_GRATIS;

  // Bloquear scroll del body al abrir el carrito, preservando la posición
  useEffect(() => {
    if (isCartOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${scrollY}px`;
    } else {
      const topValue = document.body.style.top;
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      if (topValue) {
        window.scrollTo(0, parseInt(topValue || "0", 10) * -1);
      }
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    };
  }, [isCartOpen]);

  // Al cerrar el carrito, volver siempre al paso inicial.
  useEffect(() => {
    if (!isCartOpen) setPaso("carrito");
  }, [isCartOpen]);

  // Si el carrito se vacía, regresar al paso inicial.
  useEffect(() => {
    if (cartItems.length === 0) setPaso("carrito");
  }, [cartItems.length]);

  // Solo los navegadores in-app (TikTok/Instagram/Facebook) necesitan el paso
  // extra con las instrucciones de WhatsApp. En un navegador normal el pedido
  // se envía con un solo botón, sin paso adicional.
  useEffect(() => {
    setInApp(detectInAppBrowser().isInApp);
  }, []);

  if (!isCartOpen) return null;

  const handlePostalCodeChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,5}$/.test(value)) setPostalCode(value);
  };

  const handleApplyCode = async () => {
    if (!inputCode.trim() || applying) return;
    setApplying(true);
    try {
      await applyDiscountCode(inputCode);
    } finally {
      setApplying(false);
    }
    setInputCode("");
  };

  // Limpiar el mensaje de error cuando el usuario empieza a escribir un nuevo código
  const handleInputChange = (e) => {
    setInputCode(e.target.value);
    if (errorMessage) setErrorMessage("");
  };

  const isPostalCodeValid = postalCode.length === 5;
  const tituloPanel =
    paso === "cp"
      ? "Tu envío 📦"
      : paso === "pedido"
        ? "Enviar pedido 📦"
        : "Pedido 🛒";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isCartOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={closeCart}
      ></div>

      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[400px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">{tituloPanel}</h2>
          <button
            onClick={closeCart}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-70px)] overflow-y-auto">
          {paso === "carrito" ? (
            <>
              {cartItems.length > 0 && <EnvioGratisProgress />}

              {/* Lista de productos */}
              <ShoppingCartProduct />

              {cartItems.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center text-center px-6 py-16 text-gray-500">
                  <ShoppingBag className="mb-3 text-gray-300" size={56} />
                  <p className="font-semibold text-gray-700 text-lg">
                    Tu carrito está vacío
                  </p>
                  <p className="text-sm mt-1">
                    Agrega un decant o una botella para empezar tu pedido.
                  </p>
                </div>
              )}

              {/* Subtotal, código de descuento y botón para continuar */}
              <div
                className={`border-t px-6 py-4 mt-auto ${
                  cartItems.length === 0 ? "hidden" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <input
                    value={inputCode}
                    onChange={handleInputChange}
                    placeholder="Código de descuento"
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#A47E3B] focus:outline-none w-[60%]"
                  />
                  <button
                    onClick={handleApplyCode}
                    disabled={applying}
                    className="ml-2 bg-[#A47E3B] text-white px-3 py-2 rounded-md text-sm hover:bg-[#8b6d32] disabled:opacity-50"
                  >
                    {applying ? "Validando..." : "Aplicar"}
                  </button>
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-500 mb-2">{errorMessage}</p>
                )}

                <div className="flex justify-between text-gray-700 mb-2">
                  <span>Subtotal:</span>
                  <span>${formatPrecio(subtotal)}</span>
                </div>

                {isDiscountApplied && (
                  <div className="flex justify-between items-start gap-2 text-green-700 font-medium mb-2">
                    <span className="min-w-0 break-words">
                      Descuento aplicado ({discountCode})
                    </span>
                    <span className="whitespace-nowrap shrink-0">
                      −${formatPrecio(subtotal - totalWithDiscount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-gray-900 font-semibold border-t pt-3 mb-1">
                  <span>Total:</span>
                  <span>${formatPrecio(totalWithDiscount)}</span>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  {decantsCalifican
                    ? "Tu envío es gratis (zona regular DHL)."
                    : "El envío no está incluido; se cotiza según tu código postal."}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    track("ir_a_checkout");
                    closeCart();
                    navigate("/checkout");
                  }}
                  disabled={cartItems.length === 0}
                  className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] active:bg-[#8B6A30] text-white py-3 rounded-md font-semibold transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Ir a pagar
                </button>
              </div>
            </>
          ) : paso === "cp" ? (
            /* PASO 2: solo código postal y total (sin la parte de WhatsApp) */
            <div className="p-6 flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setPaso("carrito")}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 self-start"
              >
                <ArrowLeft size={16} />
                Volver al carrito
              </button>

              {cartItems.some((i) => i.tipoVenta === "decant") && (
                <EnvioGratisProgress />
              )}

              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                <p className="font-bold text-gray-900 mb-1">
                  Tu código postal:
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Necesito tu <strong>código postal</strong> para confirmar tu
                  zona de envío. Con él cotizo el costo exacto, o aplico tu{" "}
                  <strong>envío gratis</strong> si tus decants ya califican.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="postalCode"
                  className="text-sm font-medium text-gray-700"
                >
                  Tu código postal (5 dígitos):
                </label>
                <input
                  id="postalCode"
                  type="text"
                  value={postalCode}
                  onChange={handlePostalCodeChange}
                  placeholder="Ej. 72000"
                  className={`border rounded-md px-3 py-3 text-base focus:ring-2 focus:ring-[#A47E3B] focus:outline-none transition-colors ${
                    isPostalCodeValid
                      ? "bg-white border-gray-300 text-gray-800"
                      : "bg-red-50 border-red-300 text-gray-800 placeholder:text-gray-400"
                  }`}
                  inputMode="numeric"
                  maxLength={5}
                  autoFocus
                />
                {!isPostalCodeValid && postalCode.length > 0 && (
                  <p className="text-xs text-red-500">
                    El código postal debe tener 5 dígitos.
                  </p>
                )}
              </div>

              <div className="flex justify-between text-gray-900 font-semibold border-t pt-3">
                <span>Total de tu pedido:</span>
                <span>${formatPrecio(totalWithDiscount)}</span>
              </div>

              {inApp ? (
                <button
                  type="button"
                  onClick={() => {
                    track("continuar_a_pedido");
                    setPaso("pedido");
                  }}
                  disabled={!isPostalCodeValid}
                  className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] active:bg-[#8B6A30] text-white py-3 rounded-md font-semibold transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              ) : (
                <div
                  className={
                    !isPostalCodeValid ? "opacity-50 cursor-not-allowed" : ""
                  }
                >
                  <Checkout
                    totalCartPrice={totalWithDiscount}
                    postalCode={postalCode}
                    disabled={!isPostalCodeValid}
                  />
                </div>
              )}
            </div>
          ) : (
            /* PASO 3: cómo enviar el pedido por WhatsApp */
            <div className="p-6 flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setPaso("cp")}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 self-start"
              >
                <ArrowLeft size={16} />
                Atrás
              </button>

              <div className="flex justify-between text-gray-900 font-semibold border-b pb-3">
                <span>Total de tu pedido:</span>
                <span>${formatPrecio(totalWithDiscount)}</span>
              </div>

              <Checkout
                totalCartPrice={totalWithDiscount}
                postalCode={postalCode}
                disabled={!isPostalCodeValid}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
