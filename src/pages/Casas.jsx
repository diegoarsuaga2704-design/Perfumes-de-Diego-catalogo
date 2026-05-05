import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  getCasasConImagen,
  getConteoProductosPorCasa,
} from "../functions/getCasas";

export default function Casas() {
  const navigate = useNavigate();
  const [casas, setCasas] = useState([]);
  const [conteo, setConteo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [casasData, conteoData] = await Promise.all([
          getCasasConImagen(),
          getConteoProductosPorCasa(),
        ]);
        setCasas(casasData);
        setConteo(conteoData);
      } catch (err) {
        console.error("Error cargando casas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function handleClickCasa(nombreCasa) {
    navigate("/home", { state: { selectedCasa: nombreCasa } });
  }

  return (
    <section className="bg-gray-100 min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-6">
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
            Casas y Marcas
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Explora por casa de perfumería
          </p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Cargando...</p>
        ) : casas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-500">
              Próximamente subiremos imágenes de cada casa.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {casas.map((casa) => (
              <button
                key={casa.id}
                onClick={() => handleClickCasa(casa.nombre)}
                className="group relative aspect-square overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 bg-gray-200"
              >
                <img
                  src={casa.imagen_hero}
                  alt={casa.nombre}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Overlay degradado */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Conteo arriba */}
                {conteo[casa.nombre] && (
                  <div className="absolute top-4 left-4 text-white text-xs font-semibold tracking-wider uppercase">
                    {conteo[casa.nombre]} {conteo[casa.nombre] === 1 ? "perfume" : "perfumes"}
                  </div>
                )}

                {/* Nombre abajo */}
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <h3 className="text-white text-2xl sm:text-3xl font-bold">
                    {casa.nombre}
                  </h3>
                  {casa.descripcion && (
                    <p className="text-white/80 text-sm mt-1 line-clamp-2">
                      {casa.descripcion}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}