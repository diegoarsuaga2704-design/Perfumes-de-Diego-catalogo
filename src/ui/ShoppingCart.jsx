import { useCart } from "../context/CartContext";
import { X } from "lucide-react";
import ShoppingCartProduct from "./ShoppingCartProduct";
import EnvioGratisProgress from "./EnvioGratisProgress";
import Checkout from "./Checkout";
import { useState } from "react";

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
    errorMessage,
  } = useCart();

  const [postalCode, setPostalCode] = useState("");
  const [inputCode, setInputCode] = useState("");

  if (!isCartOpen) return null;

  const handlePostalCodeChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,5}$/.test(value)) setPostalCode(value);
  };

  const handleApplyCode = () => {
    applyDiscountCode(inputCode);
    setInputCode("");
  };

  const isPostalCodeValid = postalCode.length === 5;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
          isCartOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={closeCart}
      ></div>

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Pedido 🛒</h2>
          <button
            onClick={closeCart}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-70px)] overflow-y-auto">
          <EnvioGratisProgress />

          {/* Lista de productos */}
          <ShoppingCartProduct />

          {/* Subtotal y código de descuento */}
          <div
            className={`border-t px-6 py-4 mt-auto ${
              cartItems.length === 0 ? "hidden" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Código de descuento"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#A47E3B] focus:outline-none w-[60%]"
              />
              <button
                onClick={handleApplyCode}
                className="ml-2 bg-[#A47E3B] text-white px-3 py-2 rounded-md text-sm hover:bg-[#8b6d32]"
              >
                Aplicar
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs text-red-500 mb-2">{errorMessage}</p>
            )}

            <div className="flex justify-between text-gray-700 mb-2">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {isDiscountApplied && (
              <div className="flex justify-between text-green-700 font-medium mb-2">
                <span>Descuento aplicado ({discountCode})</span>
                <span>− ${(subtotal - totalWithDiscount).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-900 font-semibold border-t pt-3">
              <span>Total:</span>
              <span>${totalWithDiscount.toFixed(2)}</span>
            </div>

            <div className={`${cartItems.length === 0 ? "hidden" : ""}`}>
              <div className="border-b p-4 flex flex-col gap-2">
                <label
                  htmlFor="postalCode"
                  className="text-sm font-medium text-gray-700"
                >
                  Ingresa tu código postal:
                </label>
                <input
                  id="postalCode"
                  type="text"
                  value={postalCode}
                  onChange={handlePostalCodeChange}
                  placeholder="Ej. 12345"
                  className="border bg-red-200 border-gray-300 rounded-md px-3 py-2 placeholder:text-black text-white text-sm focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
                  inputMode="numeric"
                  maxLength={5}
                />
              </div>
            </div>

            <div
              className={`mt-4 ${
                !isPostalCodeValid ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Checkout
                totalCartPrice={totalWithDiscount}
                postalCode={postalCode}
                disabled={!isPostalCodeValid}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
