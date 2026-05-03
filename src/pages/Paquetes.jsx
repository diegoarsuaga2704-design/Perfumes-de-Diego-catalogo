import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ShoppingCart, Sparkles } from "lucide-react";
import { getPaquetesPublicos } from "../functions/getPaquetesAdmin";
import LoadingSpinner from "../ui/LoadingSpinner";

export default function Paquetes() {
  const navigate = useNavigate();
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaquetesPublicos()
      .then((data) => setPaquetes(data || []))
      .catch((err) => {
        console.error("Error cargando paquetes:", err);
        setPaquetes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (paquete) => {
    // Placeholder - se conectará en sub-fase C
    alert(
      `"${paquete.nombre}" estará disponible para agregar al carrito muy pronto. Por ahora puedes contactarme por WhatsApp.`,
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <section className="bg-gray-100 min-h-screen py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Encabezado */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#A47E3B] rounded-full mb-4">
            <Package className="text-white" size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Paquetes de Decants
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Selecciones de perfumes para descubrir varios perfumes a un mejor
            precio. Cada paquete incluye decants listos para probar.
          </p>
        </div>

        {/* Lista de paquetes */}
        {paquetes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center max-w-xl mx-auto">
            <Package className="mx-auto mb-4 text-gray-300" size={48} />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No hay paquetes disponibles por ahora
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Estoy preparando nuevos paquetes. Mientras tanto, puedes explorar
              el catálogo individual.
            </p>
            <button
              onClick={() => navigate("/home")}
              className="bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-colors"
            >
              Ver catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {paquetes.map((paquete) => (
              <PaqueteCard
                key={paquete.id}
                paquete={paquete}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PaqueteCard({ paquete, onAddToCart }) {
  const precio = Number(paquete.precio) || 0;
  const precioIndividual = paquete.precioIndividual
    ? Number(paquete.precioIndividual)
    : null;
  const ahorro =
    precioIndividual && precioIndividual > precio ? precioIndividual - precio : 0;
  const porcentajeAhorro = ahorro
    ? Math.round((ahorro / precioIndividual) * 100)
    : 0;

  return (
    <article className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100">
      {/* Imagen con badge de ahorro */}
      <div className="relative bg-gray-50">
        {paquete.imagen ? (
          <img
            src={paquete.imagen}
            alt={paquete.nombre}
            loading="lazy"
            className="w-full h-56 sm:h-64 object-cover"
          />
        ) : (
          <div className="w-full h-56 sm:h-64 flex items-center justify-center bg-gray-100">
            <Package className="text-gray-300" size={48} />
          </div>
        )}

        {ahorro > 0 && (
          <div className="absolute top-3 right-3 bg-[#A47E3B] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
            <Sparkles size={12} />
            Ahorras ${ahorro.toLocaleString("es-MX")} ({porcentajeAhorro}%)
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {/* Nombre y descripción */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {paquete.nombre}
        </h2>
        {paquete.descripcion && (
          <p className="text-sm text-gray-600 mb-4">{paquete.descripcion}</p>
        )}

        {/* Lista de perfumes incluidos */}
        {paquete.perfumesInfo && paquete.perfumesInfo.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Incluye
            </p>
            <ul className="space-y-1.5">
              {paquete.perfumesInfo.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-800 truncate pr-2">
                    <span className="font-medium">{p.nombre}</span>
                    <span className="text-gray-500"> · {p.casa}</span>
                  </span>
                  <span className="text-gray-600 text-xs flex-shrink-0 font-medium">
                    {p.mililitros} ml
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Precios */}
        <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
          <div>
            {precioIndividual && precioIndividual > precio && (
              <p className="text-sm text-gray-400 line-through">
                ${precioIndividual.toLocaleString("es-MX")}
              </p>
            )}
            <p className="text-3xl font-bold text-gray-900">
              ${precio.toLocaleString("es-MX")}
            </p>
          </div>
        </div>

        {/* Botón */}
        <button
          onClick={() => onAddToCart(paquete)}
          className="w-full bg-[#A47E3B] hover:bg-[#D4AF7A] text-white py-3 rounded-md font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart size={16} />
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}
