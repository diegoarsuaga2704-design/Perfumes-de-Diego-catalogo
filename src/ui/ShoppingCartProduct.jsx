import { useCart } from "../context/CartContext";
import { useState } from "react";
import {
  calcularPrecioDecantCarrito,
  getIncrementoMililitros,
  getMililitrosMinimos,
} from "../functions/pricingDecant";

function ShoppingCartProduct() {
  const {
    cartItems,
    removeFromCart,
    updateCartItem,
    discountType,
    discountValue,
    isDiscountApplied,
  } = useCart();

  const [editingItem, setEditingItem] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const calculateItemTotal = (item) => {
    if (item.tipoVenta === "botella") {
      return (item.precioUnitario || 0) * (item.cantidad || 0);
    }
    if (item.tipoVenta === "decant") {
      return calcularPrecioDecantCarrito(item);
    }
    return 0;
  };

  const productHasDiscount = (item) => {
    if (!isDiscountApplied) return false;
    return item.tipoVenta === "decant";
  };

  const getDiscountedPrice = (item) => {
    const itemTotal = calculateItemTotal(item);
    if (!productHasDiscount(item)) return itemTotal;
    if (discountType === "percentage") {
      return itemTotal - (itemTotal * discountValue) / 100;
    }
    if (discountType === "amount") {
      return Math.max(0, itemTotal - discountValue);
    }
    return itemTotal;
  };

  const handleIncrease = (item) => {
    if (item.tipoVenta === "botella") {
      if (item.cantidad < item.stockDisponible) {
        updateCartItem(item.id, "botella", item.cantidad + 1);
      }
    }

    if (item.tipoVenta === "decant") {
      const incremento = getIncrementoMililitros(item);
      const nuevosMl = item.mililitros + incremento;
      // Validar stock si existe
      if (item.stockDisponible && nuevosMl > item.stockDisponible) return;
      updateCartItem(item.id, "decant", nuevosMl);
    }
  };

  const handleDecrease = (item) => {
    if (item.tipoVenta === "botella" && item.cantidad > 1) {
      updateCartItem(item.id, "botella", item.cantidad - 1);
    }

    if (item.tipoVenta === "decant") {
      const incremento = getIncrementoMililitros(item);
      const minimo = getMililitrosMinimos(item);
      const nuevosMl = item.mililitros - incremento;
      if (nuevosMl >= minimo) {
        updateCartItem(item.id, "decant", nuevosMl);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 items-center">
      {cartItems.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">
          Tu carrito está vacío.
        </p>
      ) : (
        cartItems.map((item) => {
          const itemTotal = calculateItemTotal(item);
          const hasDiscount = productHasDiscount(item);
          const discountedPrice = getDiscountedPrice(item);

          return (
            <div
              key={`${item.id}-${item.tipoVenta}`}
              className="flex gap-4 border-b py-3"
            >
              <img
                src={item.image}
                alt={item.nombre}
                loading="lazy"
                className="w-24 h-32 object-cover rounded-md"
              />

              <div className="flex-1">
                <h3 className="text-sm font-medium">{item.nombre}</h3>
                <p className="text-gray-500 text-sm">{item.casa}</p>

                {/* Información de cantidad */}
                {item.tipoVenta === "botella" && (
                  <>
                    <p className="text-gray-500 text-sm">
                      Contenido: {item.mlBotella} ml
                    </p>
                    <p className="text-gray-500 text-sm">
                      Piezas: {item.cantidad}
                    </p>
                  </>
                )}

                {item.tipoVenta === "decant" && (
                  <p className="text-gray-500 text-sm">
                    Cantidad: {item.mililitros} ml
                  </p>
                )}

                {/* Precios */}
                {hasDiscount ? (
                  <div className="mt-1">
                    <p className="text-gray-400 text-sm line-through">
                      ${itemTotal.toFixed(2)}
                    </p>
                    <p className="text-green-700 font-semibold text-base">
                      ${discountedPrice.toFixed(2)}{" "}
                      <span className="text-xs text-green-600 font-normal">
                        (
                        {discountType === "percentage"
                          ? `-${discountValue}%`
                          : `-$${discountValue}`}
                        )
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-900 font-semibold">
                    ${itemTotal.toFixed(2)}
                  </p>
                )}

                {/* Edición */}
                {editingItem === item.id ? (
                  <div className="flex gap-2 mt-2 items-center">
                    <button
                      onClick={() => handleDecrease(item)}
                      className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100"
                    >
                      -
                    </button>

                    <span className="text-sm">
                      {item.tipoVenta === "botella"
                        ? item.cantidad
                        : item.mililitros}
                    </span>

                    <button
                      onClick={() => handleIncrease(item)}
                      className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100"
                    >
                      +
                    </button>

                    <button
                      onClick={() => setEditingItem(null)}
                      className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100 ml-2"
                    >
                      Guardar
                    </button>
                  </div>
                ) : confirmingDelete === `${item.id}-${item.tipoVenta}` ? (
                  <div className="flex gap-2 mt-2 items-center">
                    <span className="text-xs text-gray-700">¿Eliminar?</span>
                    <button
                      onClick={() => {
                        removeFromCart(item.id, item.tipoVenta);
                        setConfirmingDelete(null);
                      }}
                      className="text-xs px-3 py-1 border rounded-md bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    >
                      Sí
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(null)}
                      className="text-xs px-3 py-1 border rounded-md hover:bg-gray-100"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setEditingItem(item.id)}
                      className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        setConfirmingDelete(`${item.id}-${item.tipoVenta}`)
                      }
                      className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default ShoppingCartProduct;
