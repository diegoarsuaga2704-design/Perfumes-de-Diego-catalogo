import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getTestimoniosDestacados } from "../functions/getTestimonios";
import SEO from "../ui/SEO";

export default function Testimonios() {
  const navigate = useNavigate();
  const [testimonios, setTestimonios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 100 = el tope; si tienes 500 ajusta. Es la página completa, no muestra aleatoria.
        const data = await getTestimoniosDestacados(100);
        setTestimonios(data);
      } catch (err) {
        console.error("Error cargando testimonios:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <section className="bg-gray-100 min-h-screen py-10 sm:py-14">
      <SEO
        title="Reseñas y testimonios reales"
        description="Lo que dicen los clientes que ya recibieron sus decants y botellas. Testimonios verificados de Perfumes de Diego."
      />
      <div className="max-w-6xl mx-auto px-6">
        {/* Botón volver */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#A47E3B] transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Volver
        </button>

        {/* Encabezado */}
        <div className="text-center mb-10">
          <h1 className="text-[#A47E3B] text-3xl sm:text-4xl font-extrabold mb-2">
            Reseñas y testimonios
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
            Lo que dicen los clientes que ya recibieron sus pedidos.
            {testimonios.length > 0 && (
              <> {testimonios.length} reseñas verificadas.</>
            )}
          </p>
        </div>

        {/* Estados */}
        {loading ? (
          <p className="text-center text-gray-500 py-12">Cargando...</p>
        ) : testimonios.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-500">
              Próximamente subiremos testimonios de mis clientes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonios.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#A47E3B] to-[#D4AF7A] text-white flex items-center justify-center font-bold text-xl sm:text-2xl ring-2 ring-[#A47E3B] ring-offset-2 ring-offset-white flex-shrink-0">
                    {t.nombre?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                      {t.nombre}
                    </p>
                    <p className="text-xs text-gray-500">Cliente verificado</p>
                  </div>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  "{t.texto}"
                </p>

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
        )}

        {/* CTA al final */}
        {testimonios.length > 0 && (
          <div className="mt-12 text-center bg-white rounded-2xl p-8 border border-gray-200">
            <p className="text-gray-700 text-base sm:text-lg mb-3 font-semibold">
              ¿Listo para hacer tu pedido?
            </p>
            <p className="text-gray-600 text-sm mb-5">
              Explora el catálogo o escríbeme directamente por WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/home")}
                className="bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-6 py-3 rounded-md font-semibold text-sm transition-colors"
              >
                Ver catálogo
              </button>
              <button
                onClick={() => {
                  window.open(
                    "https://wa.me/5212212034647?text=Hola%20Diego%2C%20vi%20los%20testimonios%20y%20me%20interesa%20hacer%20un%20pedido",
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-md font-semibold text-sm transition-colors"
              >
                Escribir por WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}