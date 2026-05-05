import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, ImageOff, Image as ImageIcon } from "lucide-react";
import { getAllCasas } from "../functions/getCasas";

export default function AdminCasasList() {
  const navigate = useNavigate();
  const [casas, setCasas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todas"); // todas | con-imagen | sin-imagen

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const data = await getAllCasas();
      setCasas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const casasFiltradas = casas.filter((c) => {
    if (filtro === "con-imagen") return !!c.imagen_hero;
    if (filtro === "sin-imagen") return !c.imagen_hero;
    return true;
  });

  const conImagen = casas.filter((c) => c.imagen_hero).length;
  const sinImagen = casas.length - conImagen;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 hover:text-[#D4AF7A] transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Volver al panel</span>
          </button>
          <h1 className="text-lg sm:text-xl font-bold">
            Casas ({casas.length})
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filtros */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFiltro("todas")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              filtro === "todas"
                ? "bg-[#A47E3B] text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Todas ({casas.length})
          </button>
          <button
            onClick={() => setFiltro("con-imagen")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              filtro === "con-imagen"
                ? "bg-[#A47E3B] text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Con imagen ({conImagen})
          </button>
          <button
            onClick={() => setFiltro("sin-imagen")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              filtro === "sin-imagen"
                ? "bg-[#A47E3B] text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Sin imagen ({sinImagen})
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Cargando...</p>
        ) : casasFiltradas.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            No hay casas que coincidan con el filtro.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {casasFiltradas.map((casa) => (
              <div
                key={casa.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex"
              >
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                  {casa.imagen_hero ? (
                    <img
                      src={casa.imagen_hero}
                      alt={casa.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageOff className="text-gray-400" size={32} />
                  )}
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <div>
                    <p className="font-semibold text-gray-900 truncate">
                      {casa.nombre}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {casa.descripcion || "Sin descripción"}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/casas/${casa.id}`)}
                    className="self-end flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 transition-colors"
                  >
                    <Pencil size={12} />
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}