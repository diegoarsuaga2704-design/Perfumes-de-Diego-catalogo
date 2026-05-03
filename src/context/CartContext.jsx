import { createContext, useContext, useState, useEffect } from "react";
import {
  calcularPrecioDecantCarrito,
  getIncrementoMililitros,
  getMililitrosMinimos,
} from "../functions/pricingDecant";

const CartContext = createContext();
const CART_STORAGE_KEY = "perfumes-diego-cart";

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (err) {
      console.error("Error guardando carrito:", err);
    }
  }, [cartItems]);

  // 💰 Estados del descuento
  const [discountCode, setDiscountCode] = useState("");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState(null);
  const [discountTarget, setDiscountTarget] = useState("ALL");
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 🛍️ Códigos disponibles
  const availableDiscounts = {
    DIAPERFUME: {
      type: "percentage",
      value: 10,
      appliesTo: "DECANT",
      expira: "2026-04-23",
    },
  };

  // 🛒 Añadir producto (decant, botella o paquete)
  const addToCart = (product) => {
    setCartItems((prev) => {
      // === PAQUETE ===
      if (product.tipoVenta === "paquete") {
        const existing = prev.find(
          (item) =>
            item.tipoVenta === "paquete" && item.paqueteId === product.paqueteId,
        );

        if (existing) {
          return prev.map((item) =>
            item.tipoVenta === "paquete" &&
            item.paqueteId === product.paqueteId
              ? { ...item, cantidad: (item.cantidad || 1) + 1 }
              : item,
          );
        }

        return [...prev, { ...product, cantidad: 1 }];
      }

      // === DECANT / BOTELLA (lógica original sin cambios) ===
      const normalizedProduct = {
        ...product,
        stock: product.stock === false,
      };

      const existing = prev.find(
        (item) =>
          item.id === normalizedProduct.id &&
          item.tipoVenta === normalizedProduct.tipoVenta,
      );

      if (existing) {
        return prev.map((item) => {
          if (
            item.id === normalizedProduct.id &&
            item.tipoVenta === normalizedProduct.tipoVenta
          ) {
            if (item.tipoVenta === "botella") {
              if (item.cantidad + 1 > item.stockDisponible) return item;
              return {
                ...item,
                cantidad: item.cantidad + 1,
              };
            } else {
              const nuevosMl = item.mililitros + normalizedProduct.mililitros;
              if (item.stockDisponible && nuevosMl > item.stockDisponible) {
                return item;
              }
              return {
                ...item,
                mililitros: nuevosMl,
              };
            }
          }
          return item;
        });
      }

      return [...prev, normalizedProduct];
    });
  };

  // ✏️ Actualizar cantidad
  const updateCartItem = (id, tipoVenta, newValue) => {
    setCartItems((prev) =>
      prev.map((item) => {
        // Paquetes: id == paqueteId, newValue es la cantidad de paquetes
        if (tipoVenta === "paquete" && item.paqueteId === id) {
          if (newValue < 1) return item;
          return { ...item, cantidad: newValue };
        }

        if (item.id === id && item.tipoVenta === tipoVenta) {
          if (tipoVenta === "botella") {
            if (newValue > item.stockDisponible) return item;
            return { ...item, cantidad: newValue };
          }

          if (tipoVenta === "decant") {
            return { ...item, mililitros: newValue };
          }
        }
        return item;
      }),
    );
  };

  // 🗑️ Eliminar producto
  const removeFromCart = (id, tipoVenta) => {
    setCartItems((prev) =>
      prev.filter((item) => {
        if (tipoVenta === "paquete") {
          return !(item.tipoVenta === "paquete" && item.paqueteId === id);
        }
        return !(item.id === id && item.tipoVenta === tipoVenta);
      }),
    );
  };

  // ⚙️ Carrito
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  // 🧮 Subtotal
  const subtotal = cartItems.reduce((acc, item) => {
    if (item.tipoVenta === "botella") {
      return acc + (item.precioUnitario || 0) * (item.cantidad || 0);
    }

    if (item.tipoVenta === "decant") {
      return acc + calcularPrecioDecantCarrito(item);
    }

    if (item.tipoVenta === "paquete") {
      return acc + (Number(item.precio) || 0) * (item.cantidad || 1);
    }

    return acc;
  }, 0);

  // 🎟️ Aplicar descuento (NO aplica a paquetes; ya tienen su propio ahorro)
  const applyDiscountCode = (code) => {
    const upperCode = code.trim().toUpperCase();
    const discount = availableDiscounts[upperCode];

    if (!discount) {
      setErrorMessage("El código ingresado no existe o no es válido.");
      setIsDiscountApplied(false);
      return;
    }

    if (discount.expira) {
      const fechaExpira = new Date(discount.expira + "T23:59:59");
      const hoy = new Date();
      if (hoy > fechaExpira) {
        setErrorMessage(`El código ${upperCode} ya expiró.`);
        setIsDiscountApplied(false);
        return;
      }
    }

    const applicableItems = cartItems.filter((item) => {
      if (item.tipoVenta !== "decant") return false;
      if (discount.appliesTo === "ALL") return true;
      if (discount.appliesTo === "DECANT") return true;
      return item.casa === discount.appliesTo;
    });

    if (applicableItems.length === 0) {
      setErrorMessage(
        `El código ${upperCode} no aplica a los productos con stock válido en tu carrito.`,
      );
      setIsDiscountApplied(false);
      return;
    }

    setDiscountCode(upperCode);
    setDiscountType(discount.type);
    setDiscountValue(discount.value);
    setDiscountTarget(discount.appliesTo);
    setIsDiscountApplied(true);
    setErrorMessage("");
  };

  // 🧾 Calcular total con descuento
  const calculateDiscount = () => {
    if (!isDiscountApplied) return subtotal;

    let discountableTotal = 0;

    cartItems.forEach((item) => {
      if (item.tipoVenta !== "decant") return;

      let applies = false;
      if (discountTarget === "ALL") applies = true;
      else if (discountTarget === "DECANT") applies = true;

      if (applies) {
        discountableTotal += calcularPrecioDecantCarrito(item);
      }
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
