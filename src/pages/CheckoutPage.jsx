import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCart } from "../context/CartContext";
import ShoppingCartProduct from "../ui/ShoppingCartProduct";
import EnvioGratisProgress from "../ui/EnvioGratisProgress";
import Checkout from "../ui/Checkout";
import { formatPrecio } from "../functions/formatPrecio";
import { calcularPrecioDecantCarrito } from "../functions/pricingDecant";

const UMBRAL_ENVIO_GRATIS = 1950;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    cartItems,
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
    closeCart,
  } = useCart();

  const [postalCode, setPostalCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [applying, setApplying] = useState(false);

  // Cierra el panel del carrito si venía abierto.
  useEffect(() => {
    closeCart?.();
    // Sube al tope siempre — incluso después de que el carrito restaure su
    // posición al cerrarse (por eso reintentamos en los siguientes frames).
    const irArriba = () => window.scrollTo(0, 0);
    irArriba();
    const raf = requestAnimationFrame(() => {
      irArriba();
      requestAnimationFrame(irArriba);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el carrito queda vacío, regresa al catálogo.
  useEffect(() => {
    if (cartItems.length === 0) navigate("/home", { replace: true });
  }, [cartItems.length, navigate]);

  // ¿Los decants ya califican a envío gratis? (mismo cálculo que la barra)
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

  const handleInputChange = (e) => {
    setInputCode(e.target.value);
    if (errorMessage) setErrorMessage("");
  };

  const handlePostalCodeChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,5}$/.test(value)) setPostalCode(value);
  };

  const isPostalCodeValid = postalCode.length === 5;

  if (cartItems.length === 0) return null; // el efecto redirige al catálogo

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate("/home")}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={16} />
        Seguir comprando
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Finaliza tu pedido
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Resumen del pedido */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Tu pedido</h2>
          <EnvioGratisProgress />
          <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
            <ShoppingCartProduct />
          </div>
        </div>

        {/* Datos, total y envío */}
        <div className="flex flex-col gap-5">
          {/* Código de descuento */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Código de descuento
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input
                value={inputCode}
                onChange={handleInputChange}
                placeholder="Código de descuento"
                autoCapitalize="characters"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCode}
                disabled={applying}
                className="bg-[#A47E3B] text-white px-4 py-2 rounded-md text-sm hover:bg-[#8b6d32] disabled:opacity-50 whitespace-nowrap"
              >
                {applying ? "Validando..." : "Aplicar"}
              </button>
            </div>
            {errorMessage && (
              <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
            )}
          </div>

          {/* Código postal */}
          <div>
            <label
              htmlFor="cp"
              className="text-sm font-medium text-gray-700"
            >
              Tu código postal (5 dígitos)
            </label>
            <p className="text-xs text-gray-500 mt-1 mb-1">
              Lo necesito para cotizar tu envío, o aplicar tu envío gratis si tus
              decants ya califican.
            </p>
            <input
              id="cp"
              type="text"
              value={postalCode}
              onChange={handlePostalCodeChange}
              placeholder="Ej. 72000"
              inputMode="numeric"
              maxLength={5}
              className={`w-full border rounded-md px-3 py-3 text-base focus:ring-2 focus:ring-[#A47E3B] focus:outline-none transition-colors ${
                isPostalCodeValid
                  ? "bg-white border-gray-300 text-gray-800"
                  : "bg-red-50 border-red-300 text-gray-800 placeholder:text-gray-400"
              }`}
            />
            {!isPostalCodeValid && postalCode.length > 0 && (
              <p className="text-xs text-red-500 mt-1">
                El código postal debe tener 5 dígitos.
              </p>
            )}
          </div>

          {/* Totales */}
          <div className="border-t pt-4">
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

            <div className="flex justify-between text-gray-900 font-bold text-lg border-t pt-3">
              <span>Total:</span>
              <span>${formatPrecio(totalWithDiscount)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {decantsCalifican
                ? "Tu envío es gratis (zona regular DHL)."
                : "El envío no está incluido; se cotiza según tu código postal."}
            </p>
          </div>

          {/* Enviar por WhatsApp */}
          <div className={!isPostalCodeValid ? "opacity-50" : ""}>
            <Checkout
              totalCartPrice={totalWithDiscount}
              postalCode={postalCode}
              disabled={!isPostalCodeValid}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
