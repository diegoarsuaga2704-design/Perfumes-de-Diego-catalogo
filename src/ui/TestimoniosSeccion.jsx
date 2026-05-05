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

  // Si no hay testimonios destacados o está cargando, no renderiza nada
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
              <div className="flex items-center gap-3 mb-4">
                {t.foto_cliente ? (
                  <img
                    src={t.foto_cliente}
                    alt={t.nombre}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#A47E3B]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#A47E3B] text-white flex items-center justify-center font-bold text-lg">
                    {t.nombre?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{t.nombre}</p>
                  <p className="text-xs text-gray-500">Cliente verificado</p>
                </div>
              </div>

              <p className="text-gray-700 text-sm leading-relaxed flex-1">
                "{t.texto}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}