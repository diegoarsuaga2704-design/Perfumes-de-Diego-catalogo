import { useEffect, useState } from "react";
import { getTestimoniosDestacados } from "../functions/getTestimonios";

export default function TestimoniosSeccion() {
  const [testimonios, setTestimonios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getTestimoniosDestacados(6);
        setTestimonios(data);
      } catch (err) {
        console.error("Error cargando testimonios:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || testimonios.length === 0) return null;

  return (
    <section className="bg-white py-12 sm:py-16 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Testimonios reales de quienes ya compraron
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonios.map((t) => (
            <div
              key={t.id}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Header: avatar con iniciales + nombre */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#A47E3B] to-[#D4AF7A] text-white flex items-center justify-center font-bold text-xl sm:text-2xl ring-2 ring-[#A47E3B] ring-offset-2 ring-offset-gray-50 flex-shrink-0">
                  {t.nombre?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                    {t.nombre}
                  </p>
                  <p className="text-xs text-gray-500">Cliente verificado</p>
                </div>
              </div>

              {/* Texto del testimonio */}
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                "{t.texto}"
              </p>

              {/* Foto del pedido (opcional) */}
              {t.foto_producto && (
                <div className="mt-auto rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={t.foto_producto}
                    alt={`Pedido de ${t.nombre}`}
                    loading="lazy"
                    className="w-full h-56 sm:h-64 object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}