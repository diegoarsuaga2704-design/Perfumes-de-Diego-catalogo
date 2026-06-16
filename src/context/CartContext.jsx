import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../services/supabase";
import {
  calcularPrecioDecantCarrito,
  getIncrementoMililitros,
  getMililitrosMinimos,
} from "../functions/pricingDecant";

const CartContext = createContext();
const CART_STORAGE_KEY = "perfumes-diego-cart";
const CART_EXPIRY_DAYS = 10;
const CART_EXPIRY_MS = CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);

      // Formato viejo (sin timestamp): se descarta para que se rehidrate con el nuevo formato.
      if (!parsed.savedAt || !Array.isArray(parsed.items)) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
      }

      // Verificar si el carrito caducó
      const ageMs = Date.now() - parsed.savedAt;
      if (ageMs > CART_EXPIRY_MS) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
      }

      return parsed.items;
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      // Guardar con timestamp para poder verificar caducidad
      const payload = {
        items: cartItems,
        savedAt: Date.now(),
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
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

  // 🛍️ Códigos: ahora viven en Supabase (tabla codigos_descuento) y se
  // validan server-side con la función validar_cupon. Ya no hay nada hardcodeado.

  // 🛒 Añadir producto (decant o botella)
  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.id === product.id &&
          item.tipoVenta === product.tipoVenta,
      );

      if (existing) {
        return prev.map((item) => {
          if (
            item.id === product.id &&
            item.tipoVenta === product.tipoVenta
          ) {
            if (item.tipoVenta === "botella") {
              if (item.cantidad + 1 > item.stockDisponible) return item;
              return {
                ...item,
                cantidad: item.cantidad + 1,
              };
            } else {
              const nuevosMl = item.mililitros + product.mililitros;
              return {
                ...item,
                mililitros: nuevosMl,
              };
            }
          }
          return item;
        });
      }

      return [...prev, { ...product }];
    });
  };

  // ✏️ Actualizar cantidad
  const updateCartItem = (id, tipoVenta, newValue) => {
    setCartItems((prev) =>
      prev.map((item) => {
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
      prev.filter((item) => !(item.id === id && item.tipoVenta === tipoVenta)),
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
    return acc;
  }, 0);

  // 🎟️ Aplicar descuento — valida server-side con la función validar_cupon.
  // (NO aplica a paquetes; ya tienen su propio ahorro)
  const applyDiscountCode = async (code) => {
    const upperCode = code.trim().toUpperCase();

    // 1) Validar contra Supabase. La lista de códigos nunca sale al navegador.
    const { data, error } = await supabase.rpc("validar_cupon", {
      p_codigo: upperCode,
    });

    if (error) {
      console.error("Error validando cupón:", error);
      setErrorMessage("Hubo un problema al validar el código. Intenta de nuevo.");
      return;
    }

    const resultado = data?.[0];

    // 2) Si no es válido, mostramos el motivo y MANTENEMOS el descuento previo si lo había.
    if (!resultado || !resultado.valido) {
      setErrorMessage(
        resultado?.mensaje || `El código "${upperCode}" no es válido.`,
      );
      return;
    }

    const target = resultado.aplica_a;

    // 3) Verificar que el código aplique a algo en el carrito actual.
    const applicableItems = cartItems.filter((item) => {
      if (target === "ALL") return true;
      if (target === "DECANT") return item.tipoVenta === "decant";
      if (target === "BOTELLA") return item.tipoVenta === "botella";
      if (target === "BOTELLA_SELLADA")
        return (
          item.tipoVenta === "botella" &&
          item.estado_botella?.startsWith("Sellado")
        );
      return item.tipoVenta === "decant" && item.casa === target;
    });

    if (applicableItems.length === 0) {
      setErrorMessage(
        `El código ${upperCode} no aplica a los productos de tu carrito.`,
      );
      return;
    }

    // 4) Válido: aplica el descuento y limpia el error.
    setDiscountCode(upperCode);
    setDiscountType(resultado.tipo);
    setDiscountValue(Number(resultado.valor));
    setDiscountTarget(target);
    setIsDiscountApplied(true);
    setErrorMessage("");
  };

  // 🧾 Calcular total con descuento
  const calculateDiscount = () => {
    if (!isDiscountApplied) return subtotal;

    let discountableTotal = 0;

    cartItems.forEach((item) => {
      let applies = false;
      if (discountTarget === "ALL") applies = true;
      else if (discountTarget === "DECANT") applies = item.tipoVenta === "decant";
      else if (discountTarget === "BOTELLA") applies = item.tipoVenta === "botella";
      else if (discountTarget === "BOTELLA_SELLADA")
        applies = item.tipoVenta === "botella" && item.estado_botella?.startsWith("Sellado");

      if (!applies) return;

      if (item.tipoVenta === "decant") {
        discountableTotal += calcularPrecioDecantCarrito(item);
      } else if (item.tipoVenta === "botella") {
        discountableTotal += (item.precioUnitario || 0) * (item.cantidad || 0);
      }
    });

    let totalAfterDiscount = subtotal;

    if (discountType === "percentage") {
      totalAfterDiscount -= (discountableTotal * discountValue) / 100;
    } else if (discountType === "amount") {
      totalAfterDiscount -= Math.min(discountValue, discountableTotal);
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
        setErrorMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
