import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, ImageOff } from "lucide-react";
import {
  getAllCasas,
  getConteoProductosPorCasa,
  deleteCasa,
} from "../functions/getCasas";
import { useToast } from "../context/ToastContext";

export default function AdminCasasList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [casas, setCasas] = useState([]);
  const [conteo, setConteo] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todas");
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [casasData, conteoData] = await Promise.all([
        getAllCasas(),
        getConteoProductosPorCasa(),
      ]);
      setCasas(casasData);
      setConteo(conteoData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar(casa) {
    const confirmar = window.confirm(
      `¿Borrar la casa "${casa.nombre}"? No tiene perfumes asociados.`,
    );
    if (!confirmar) return;
    try {
      setEliminando(casa.id);
      await deleteCasa(casa.id);
      await fetchData();
    } catch {
      showToast("Error al borrar la casa.", "error");
    } finally {
      setEliminando(null);
    }
  }

  const casasFiltradas = casas.filter((c) => {
    if (filtro === "con-imagen") return !!c.imagen_hero;
    if (filtro === "sin-imagen") return !c.imagen_hero;
    if (filtro === "sin-perfumes") return !conteo[c.nombre];
    return true;
  });

  const conImagen = casas.filter((c) => c.imagen_hero).length;
  const sinImagen = casas.length - conImagen;
  const sinPerfumes = casas.filter((c) => !conteo[c.nombre]).length;

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
          <button
            onClick={() => setFiltro("sin-perfumes")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              filtro === "sin-perfumes"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Sin perfumes ({sinPerfumes})
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
            {casasFiltradas.map((casa) => {
              const numPerfumes = conteo[casa.nombre] || 0;
              const sinPerfumesAsociados = numPerfumes === 0;
              return (
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
                      <p className="text-xs text-gray-500">
                        {numPerfumes}{" "}
                        {numPerfumes === 1 ? "perfume" : "perfumes"}
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        onClick={() => navigate(`/admin/casas/${casa.id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 transition-colors"
                      >
                        <Pencil size={12} />
                        Editar
                      </button>
                      {sinPerfumesAsociados && (
                        <button
                          onClick={() => handleEliminar(casa)}
                          disabled={eliminando === casa.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                          {eliminando === casa.id ? "..." : "Eliminar"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}