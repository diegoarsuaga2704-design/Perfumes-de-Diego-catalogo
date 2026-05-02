import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Pencil,
  Trash2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getAllParfumsAdmin,
  deleteParfumAdmin,
} from "../functions/getParfumsAdmin";
import LoadingSpinner from "../ui/LoadingSpinner";

export default function AdminPerfumesList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar perfumes al montar
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAllParfumsAdmin();
      setParfums(data);
      setError(null);
    } catch (err) {
      setError("No se pudieron cargar los perfumes.");
    } finally {
      setLoading(false);
    }
  };

  // Filtrado por búsqueda
  const filtered = useMemo(() => {
    if (!search.trim()) return parfums;
    const q = search.toLowerCase();
    return parfums.filter(
      (p) =>
        (p.nombre || "").toLowerCase().includes(q) ||
        (p.casa || "").toLowerCase().includes(q),
    );
  }, [parfums, search]);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteParfumAdmin(id);
      setParfums((prev) => prev.filter((p) => p.id !== id));
      setConfirmingDelete(null);
    } catch (err) {
      alert("Error al borrar el perfume. Intenta de nuevo.");
    } finally {
      setDeleting(false);
    }
  };

  const getDisponibleColor = (disponible) => {
    if (disponible === "Disponible")
      return "bg-green-100 text-green-700 border-green-200";
    if (disponible === "Agotado") return "bg-red-100 text-red-700 border-red-200";
    if (disponible === "Próximamente")
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 hover:bg-gray-700 rounded-md transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Perfumes ({parfums.length})
              </h1>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/perfumes/nuevo")}
            className="flex items-center gap-2 bg-[#A47E3B] hover:bg-[#D4AF7A] px-4 py-2 rounded-md text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo perfume</span>
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Buscador */}
        <div className="mb-4 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o casa..."
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A47E3B] focus:border-[#A47E3B] outline-none bg-white"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            {search
              ? "No hay perfumes que coincidan con la búsqueda."
              : "Aún no hay perfumes en el catálogo."}
          </div>
        ) : (
          <>
            {/* Vista escritorio: tabla */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase px-4 py-3">
                      Imagen
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase px-4 py-3">
                      Nombre
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase px-4 py-3">
                      Casa
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase px-4 py-3">
                      Tipo
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase px-4 py-3">
                      Concentración
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase px-4 py-3">
                      Precio
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase px-4 py-3">
                      Estado
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-700 uppercase px-4 py-3">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <img
                          src={p.image}
                          alt={p.nombre}
                          loading="lazy"
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {p.nombre}
                        </div>
                        {p.esBestSeller && (
                          <span className="text-[10px] bg-[#A47E3B] text-white px-2 py-0.5 rounded mt-1 inline-block">
                            BEST SELLER
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.casa}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">
                          {p.stock === true ? "Botella" : "Decant"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 italic">
                        {p.concentracion || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        ${p.precio}
                        {p.stock === false && (
                          <span className="text-xs text-gray-500">/ml</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded border font-medium ${getDisponibleColor(
                            p.disponible,
                          )}`}
                        >
                          {p.disponible || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {confirmingDelete === p.id ? (
                          <div className="flex justify-end gap-1">
                            <span className="text-xs text-gray-700 self-center mr-1">
                              ¿Borrar?
                            </span>
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={deleting}
                              className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmingDelete(null)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                navigate(`/admin/perfumes/${p.id}`)
                              }
                              className="p-2 text-gray-600 hover:text-[#A47E3B] hover:bg-amber-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmingDelete(p.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Borrar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil: tarjetas */}
            <div className="md:hidden space-y-3">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg shadow p-4 flex gap-3"
                >
                  <img
                    src={p.image}
                    alt={p.nombre}
                    loading="lazy"
                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {p.nombre}
                        </h3>
                        <p className="text-xs text-gray-500">{p.casa}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border ${getDisponibleColor(
                          p.disponible,
                        )}`}
                      >
                        {p.disponible || "—"}
                      </span>
                      <span className="text-xs text-gray-700 font-medium">
                        ${p.precio}
                        {p.stock === false && "/ml"}
                      </span>
                    </div>

                    {confirmingDelete === p.id ? (
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs text-gray-700 self-center">
                          ¿Borrar?
                        </span>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting}
                          className="text-xs px-3 py-1 bg-red-600 text-white rounded"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setConfirmingDelete(null)}
                          className="text-xs px-3 py-1 border rounded"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/admin/perfumes/${p.id}`)}
                          className="flex items-center gap-1 text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          <Pencil size={12} />
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmingDelete(p.id)}
                          className="flex items-center gap-1 text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-red-600"
                        >
                          <Trash2 size={12} />
                          Borrar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
