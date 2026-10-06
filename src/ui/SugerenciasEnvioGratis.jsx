import { useMemo } from "react";
import { Link } from "react-router-dom";
import { track } from "@vercel/analytics";
import { useCart } from "../context/CartContext";
import { useParfums } from "../context/ParfumsContext";
import { getEstadoEnvioGratis } from "../functions/envioGratis";
import { calcularPrecioDecant, getOpcionesMililitros } from "../functions/pricingDecant";
import { formatPrecio } from "../functions/formatPrecio";
import { imagenThumb } from "../functions/imagenThumb";
import { slugify } from "../functions/slugify";

const MAX_SUGERENCIAS = 4;

// Dentro del carrito: si a los decants les falta para el envío gratis,
// sugiere decants de los más vendidos para agregar con un toque.
// Primero los que con una sola cantidad mínima ya alcanzan el envío gratis.
export default function SugerenciasEnvioGratis() {
  const {
    cartItems,
    addToCart,
    closeCart,
    isDiscountApplied,
    discountType,
    discountValue,
    discountTarget,
  } = useCart();
  const { parfums = [], minDecantSiempre = 0 } = useParfums() || {};

  const { califica, falta, hayElegibles } = getEstadoEnvioGratis({
    cartItems,
    isDiscountApplied,
    discountType,
    discountValue,
    discountTarget,
  });

  const sugerencias = useMemo(() => {
    const enCarrito = new Set(cartItems.map((i) => i.id));
    return parfums
      .filter(
        (p) =>
          p.esBestSeller &&
          p.stock === false &&
          p.disponible === "Disponible" &&
          !enCarrito.has(p.id),
      )
      .map((p) => {
        const ml = getOpcionesMililitros(p, { minSiempre: minDecantSiempre })[0]?.value;
        const precio = ml ? calcularPrecioDecant(p, ml) : 0;
        return { p, ml, precio, alcanza: precio >= falta };
      })
      .filter((s) => s.ml && s.precio > 0)
      .sort((a, b) => {
        if (a.alcanza !== b.alcanza) return a.alcanza ? -1 : 1;
        // Los que alcanzan: el más barato primero. Los que no: el más cercano.
        return a.alcanza ? a.precio - b.precio : b.precio - a.precio;
      })
      .slice(0, MAX_SUGERENCIAS);
  }, [parfums, cartItems, minDecantSiempre, falta]);

  if (!hayElegibles || califica || sugerencias.length === 0) return null;

  const agregar = ({ p, ml }) => {
    track("sugerencia_envio_gratis", { producto: p.nombre });
    addToCart({
      id: p.id,
      nombre: p.nombre,
      image: p.image,
      casa: p.casa,
      tipoVenta: "decant",
      precioUnitario: p.precio,
      mlBotella: null,
      mililitros: ml,
      cantidad: null,
      estado_botella: null,
    });
  };

  return (
    <div className="px-6 pb-4">
      <p className="text-sm font-semibold text-gray-900">
        Te faltan ${formatPrecio(falta)} para el envío gratis
      </p>
      <p className="text-xs text-gray-500 mb-3">Agrega uno de los favoritos de mis clientes:</p>
      <div className="space-y-2">
        {sugerencias.map((s) => (
          <div
            key={s.p.id}
            className="flex items-center gap-3 border border-gray-200 rounded-md p-2"
          >
            <img
              src={imagenThumb(s.p.image, 120)}
              alt={s.p.nombre}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.src !== s.p.image) e.currentTarget.src = s.p.image;
              }}
              className="w-12 h-12 object-cover rounded shrink-0 bg-gray-100"
            />
            <div className="min-w-0 flex-1">
              <Link
                to={`/product/${slugify(s.p.nombre)}/${s.p.id}`}
                // replace + cerrar: sustituye la entrada del carrito abierto
                // para que "atrás" regrese a la página donde estaba.
                replace
                onClick={closeCart}
                className="block text-sm font-medium text-gray-900 truncate hover:underline"
              >
                {s.p.nombre}
              </Link>
              <p className="text-xs text-gray-500 truncate">{s.p.casa}</p>
              {s.alcanza && (
                <p className="text-[11px] font-semibold text-green-700">
                  Con este llegas al envío gratis
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => agregar(s)}
              className="shrink-0 text-xs font-semibold px-3 py-2 rounded-md bg-[#A47E3B] text-white hover:bg-[#D4AF7A] active:bg-[#8B6A30]"
            >
              + {s.ml} ml · ${formatPrecio(s.precio)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
