import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 💰 Estados del descuento
  const [discountCode, setDiscountCode] = useState("");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState(null);
  const [discountTarget, setDiscountTarget] = useState("ALL"); // marca a la que aplica
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 🛍️ Códigos disponibles con restricciones
  const availableDiscounts = {
    PTM10: { type: "percentage", value: 10, appliesTo: "ALL" },
    // PROMOLV10: { type: "percentage", value: 10, appliesTo: "Louis Vuitton" },
    // TOSKO10: { type: "percentage", value: 10, appliesTo: "Toskovat" },
    FILIPPO10: {
      type: "percentage",
      value: 10,
      appliesTo: "Filippo Sorcinelli",
    },
    // ADI10: { type: "percentage", value: 10, appliesTo: "Adi Ale Van" },
  };

  // 🛒 Añadir producto
  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                mililitros: item.mililitros + product.mililitros,
                totalPrice:
                  (item.mililitros + product.mililitros) *
                  (item.totalPrice / item.mililitros),
              }
            : item
        );
      }
      return [...prev, product];
    });
  };

  // ✏️ Actualizar cantidad
  const updateCartItem = (id, newMililitros) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              mililitros: newMililitros,
              totalPrice: newMililitros * (item.totalPrice / item.mililitros),
            }
          : item
      )
    );
  };

  // 🗑️ Eliminar producto
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ⚙️ Abrir / Cerrar carrito
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  // 🧮 Subtotal general
  const subtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);

  // 🎟️ Aplicar descuento con validación de marca
  const applyDiscountCode = (code) => {
    const upperCode = code.trim().toUpperCase();
    const discount = availableDiscounts[upperCode];

    if (!discount) {
      setErrorMessage("El código ingresado no existe o no es válido.");
      setIsDiscountApplied(false);
      return;
    }

    // Verificar si hay productos aplicables

    // Verificar productos a los que puede aplicar el descuento
    const applicableItems = cartItems.filter((item) => {
      // Descuento general
      if (discount.appliesTo === "ALL") return true;

      // Caso especial: PROMOLV10 → solo Louis Vuitton con menos de 30 ml
      if (upperCode === "PROMOLV10") {
        return item.casa === "Louis Vuitton" && item.mililitros < 11;
      }

      // Si aplica a varias marcas
      if (Array.isArray(discount.appliesTo))
        return discount.appliesTo.includes(item.casa);

      // Por defecto, aplica solo a una marca específica
      return item.casa === discount.appliesTo;
    });

    if (applicableItems.length === 0) {
      setErrorMessage(
        `El código ${upperCode} no aplica a los productos en tu carrito.`
      );
      setIsDiscountApplied(false);
      return;
    }

    // Guardar información del descuento si aplica
    setDiscountCode(upperCode);
    setDiscountType(discount.type);
    setDiscountValue(discount.value);
    setDiscountTarget(discount.appliesTo);
    setIsDiscountApplied(true);
    setErrorMessage("");
  };

  // 🧾 Calcular total con descuento (solo sobre productos válidos)
  const calculateDiscount = () => {
    if (!isDiscountApplied) return subtotal;

    let discountableTotal = 0;

    cartItems.forEach((item) => {
      let applies = false;

      if (discountTarget === "ALL") applies = true;
      else if (Array.isArray(discountTarget))
        applies = discountTarget.includes(item.casa);
      else applies = item.casa === discountTarget;

      // 🔹 Ajuste: si el código es PROMOLV10, también requiere <30 ml
      if (
        discountCode === "PROMOLV10" &&
        !(item.casa === "Louis Vuitton" && item.mililitros < 11)
      ) {
        applies = false;
      }

      if (applies) discountableTotal += item.totalPrice;
    });

    let totalAfterDiscount = subtotal;

    if (discountType === "percentage") {
      totalAfterDiscount -= (discountableTotal * discountValue) / 100;
    } else if (discountType === "amount") {
      totalAfterDiscount -= discountValue;
    }

    return Math.max(0, totalAfterDiscount);
  };

  const totalWithDiscount = calculateDiscount();

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateCartItem,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        subtotal,
        totalWithDiscount,
        discountCode,
        discountType,
        discountValue,
        discountTarget,
        isDiscountApplied,
        applyDiscountCode,
        errorMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
