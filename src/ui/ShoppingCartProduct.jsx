// import { useCart } from "../context/CartContext";
// import { useState } from "react";

// function ShoppingCartProduct() {
//   const {
//     cartItems,
//     removeFromCart,
//     updateCartItem,
//     discountType,
//     discountValue,
//     discountTarget,
//     isDiscountApplied,
//   } = useCart();

//   const [editingItem, setEditingItem] = useState(null);

//   const handleIncrease = (item) => {
//     updateCartItem(item.id, item.mililitros + 1);
//   };

//   const handleDecrease = (item) => {
//     if (item.mililitros > 1) {
//       updateCartItem(item.id, item.mililitros - 1);
//     }
//   };

//   const productHasDiscount = (item) => {
//     if (!isDiscountApplied) return false;

//     // 🔹 Caso especial: código LV15 → solo Louis Vuitton y <30 ml
//     if (discountTarget === "Louis Vuitton" && item.casa === "Louis Vuitton") {
//       if (
//         item.mililitros < 11 &&
//         discountType === "percentage" &&
//         discountValue === 15
//       ) {
//         return true;
//       }
//       return false; // Louis Vuitton pero no cumple el rango de ml
//     }

//     //  Descuento general
//     if (discountTarget === "ALL") return true;

//     //  Si aplica a múltiples marcas
//     if (Array.isArray(discountTarget)) {
//       return discountTarget.includes(item.casa);
//     }
//     //  Por defecto, aplica si la marca coincide
//     return item.casa === discountTarget;
//   };

//   const getDiscountedPrice = (item) => {
//     if (!productHasDiscount(item)) return item.totalPrice;

//     if (discountType === "percentage") {
//       return item.totalPrice - (item.totalPrice * discountValue) / 100;
//     } else if (discountType === "amount") {
//       // Aplica el monto fijo directamente si el producto es elegible
//       const newPrice = item.totalPrice - discountValue;
//       return Math.max(0, newPrice);
//     }
//     return item.totalPrice;
//   };

//   return (
//     <div className="flex-1 overflow-y-auto p-6 items-center">
//       {cartItems.length === 0 ? (
//         <p className="text-gray-500 text-center mt-10">
//           Tu carrito está vacío.
//         </p>
//       ) : (
//         cartItems.map((item) => {
//           const hasDiscount = productHasDiscount(item);
//           const discountedPrice = getDiscountedPrice(item);

//           return (
//             <div key={item.id} className="flex gap-4 border-b py-3">
//               <img
//                 src={item.image}
//                 alt={item.nombre}
//                 className="w-24 h-32 object-cover rounded-md"
//               />

//               <div className="flex-1">
//                 <h3 className="text-sm font-medium">{item.nombre}</h3>
//                 <p className="text-gray-500 text-sm">{item.casa}</p>
//                 {item.mililitros && (
//                   <p className="text-gray-500 text-sm">
//                     Cantidad: {item.mililitros} ml
//                   </p>
//                 )}
//                 {item.mlBotella && (
//                   <p className="text-gray-500 text-sm">
//                     Cantidad: {item.mlBotella} ml
//                   </p>
//                 )}

//                 {/* Mostrar precios */}
//                 {hasDiscount ? (
//                   <div className="mt-1">
//                     <p className="text-gray-400 text-sm line-through">
//                       ${item.totalPrice.toFixed(2)}
//                     </p>
//                     <p className="text-green-700 font-semibold text-base">
//                       ${discountedPrice.toFixed(2)}{" "}
//                       <span className="text-xs text-green-600 font-normal">
//                         (
//                         {discountType === "percentage"
//                           ? `-${discountValue}%`
//                           : `-$${discountValue}`}
//                         )
//                       </span>
//                     </p>
//                   </div>
//                 ) : (
//                   <p className="text-gray-900 font-semibold">
//                     ${item.totalPrice.toFixed(2)}
//                   </p>
//                 )}

//                 {/* Controles de edición */}
//                 {editingItem === item.id ? (
//                   <div className="flex gap-2 mt-2">
//                     <button
//                       onClick={() => handleDecrease(item)}
//                       className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100"
//                     >
//                       -
//                     </button>
//                     <p className="text-gray-500 text-sm">
//                       {item.mililitros} ml
//                     </p>
//                     <button
//                       onClick={() => handleIncrease(item)}
//                       className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100"
//                     >
//                       +
//                     </button>
//                     <button
//                       onClick={() => setEditingItem(null)}
//                       className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100 ml-2"
//                     >
//                       Guardar
//                     </button>
//                   </div>
//                 ) : (
//                   <div className="flex gap-2 mt-2">
//                     <button
//                       onClick={() => setEditingItem(item.id)}
//                       className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100"
//                     >
//                       Editar
//                     </button>
//                     <button
//                       onClick={() => removeFromCart(item.id)}
//                       className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100"
//                     >
//                       Eliminar
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//           );
//         })
//       )}
//     </div>
//   );
// }

// export default ShoppingCartProduct;

import { useCart } from "../context/CartContext";
import { useState } from "react";

function ShoppingCartProduct() {
  const {
    cartItems,
    removeFromCart,
    updateCartItem,
    discountType,
    discountValue,
    discountTarget,
    isDiscountApplied,
  } = useCart();

  const [editingItem, setEditingItem] = useState(null);

  const calculateItemTotal = (item) => {
    if (item.tipoVenta === "botella") {
      return (item.precioUnitario || 0) * (item.cantidad || 0);
    }
    if (item.tipoVenta === "decant") {
      return (item.precioUnitario || 0) * (item.mililitros || 0);
    }
    return 0;
  };

  const productHasDiscount = (item) => {
    if (!isDiscountApplied) return false;

    if (discountTarget === "ALL") return true;

    if (Array.isArray(discountTarget)) {
      return discountTarget.includes(item.casa);
    }

    return item.casa === discountTarget;
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
      updateCartItem(item.id, "decant", item.mililitros + 1);
    }
  };

  const handleDecrease = (item) => {
    if (item.tipoVenta === "botella" && item.cantidad > 1) {
      updateCartItem(item.id, "botella", item.cantidad - 1);
    }

    if (item.tipoVenta === "decant" && item.mililitros > 1) {
      updateCartItem(item.id, "decant", item.mililitros - 1);
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
                      Botellas: {item.cantidad}
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
                ) : (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setEditingItem(item.id)}
                      className="text-xs px-2 py-1 border rounded-md hover:bg-gray-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id, item.tipoVenta)}
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
