import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Pencil,
  Trash2,
  Plus,
  AlertCircle,
  Package,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getAllPaquetesAdmin,
  deletePaqueteAdmin,
} from "../functions/getPaquetesAdmin";
import LoadingSpinner from "../ui/LoadingSpinner";

export default function AdminPaquetesList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAllPaquetesAdmin();
      setPaquetes(data);
      setError(null);
    } catch (err) {
      setError("No se pudieron cargar los paquetes.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return paquetes;
    const q = search.toLowerCase();
    return paquetes.filter(
      (p) =>
        (p.nombre || "").toLowerCase().includes(q) ||
        (p.descripcion || "").toLowerCase().includes(q),
    );
  }, [paquetes, search]);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deletePaqueteAdmin(id);
      setPaquetes((prev) => prev.filter((p) => p.id !== id));
      setConfirmingDelete(null);
    } catch (err) {
      alert("Error al borrar el paquete. Intenta de nuevo.");
    } finally {
      setDeleting(false);
    }
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
                Paquetes ({paquetes.length})
              </h1>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/paquetes/nuevo")}
            className="flex items-center gap-2 bg-[#A47E3B] hover:bg-[#D4AF7A] px-4 py-2 rounded-md text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo paquete</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="mb-4 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A47E3B] focus:border-[#A47E3B] outline-none bg-white"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            {search ? (
              "No hay paquetes que coincidan con la búsqueda."
            ) : (
              <>
                <Package className="mx-auto mb-3 text-gray-400" size={40} />
                <p className="mb-3">Aún no hay paquetes creados.</p>
                <button
                  onClick={() => navigate("/admin/paquetes/nuevo")}
                  className="bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-4 py-2 rounded-md text-sm font-semibold inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Crear primer paquete
                </button>
              </>
            )}
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
                      Contenido
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase px-4 py-3">
                      Precio
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase px-4 py-3">
                      Estado
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase px-4 py-3">
                      Orden
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-700 uppercase px-4 py-3">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => {
                    const itemsCount = (p.contenido || []).length;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          {p.imagen ? (
                            <img
                              src={p.imagen}
                              alt={p.nombre}
                              loading="lazy"
                              className="w-12 h-12 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                              <Package size={18} className="text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {p.nombre}
                          </div>
                          {p.descripcion && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {p.descripcion}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {itemsCount} perfume{itemsCount !== 1 ? "s" : ""}
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          ${p.precio}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded border font-medium ${
                              p.activo
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}
                          >
                            {p.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {p.orden ?? 0}
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
                                  navigate(`/admin/paquetes/${p.id}`)
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista móvil: tarjetas */}
            <div className="md:hidden space-y-3">
              {filtered.map((p) => {
                const itemsCount = (p.contenido || []).length;
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-lg shadow p-4 flex gap-3"
                  >
                    {p.imagen ? (
                      <img
                        src={p.imagen}
                        alt={p.nombre}
                        loading="lazy"
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                        <Package size={20} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {p.nombre}
                      </h3>
                      {p.descripcion && (
                        <p className="text-xs text-gray-500 truncate">
                          {p.descripcion}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border ${
                            p.activo
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                        <span className="text-xs text-gray-700 font-medium">
                          ${p.precio}
                        </span>
                        <span className="text-xs text-gray-500">
                          {itemsCount} perfume
                          {itemsCount !== 1 ? "s" : ""}
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
                            onClick={() =>
                              navigate(`/admin/paquetes/${p.id}`)
                            }
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
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
