import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Star, StarOff } from "lucide-react";
import {
  getAllTestimonios,
  deleteTestimonio,
  updateTestimonio,
} from "../functions/getTestimonios";

export default function AdminTestimoniosList() {
  const navigate = useNavigate();
  const [testimonios, setTestimonios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await getAllTestimonios();
      setTestimonios(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTestimonio(id);
      setTestimonios((prev) => prev.filter((t) => t.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      alert("Error al eliminar el testimonio");
    }
  }

  async function toggleDestacado(testimonio) {
    try {
      const updated = await updateTestimonio(testimonio.id, {
        destacado: !testimonio.destacado,
      });
      setTestimonios((prev) =>
        prev.map((t) => (t.id === testimonio.id ? updated : t))
      );
    } catch (err) {
      alert("Error al actualizar destacado");
    }
  }

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
            Testimonios ({testimonios.length})
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => navigate("/admin/testimonios/nuevo")}
            className="flex items-center gap-2 bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Agregar testimonio
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Cargando...</p>
        ) : testimonios.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">Aún no tienes testimonios.</p>
            <button
              onClick={() => navigate("/admin/testimonios/nuevo")}
              className="bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-5 py-2 rounded-md text-sm font-semibold transition-colors"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {testimonios.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#A47E3B] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {t.nombre?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{t.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(t.created_at).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleDestacado(t)}
                      title={
                        t.destacado ? "Quitar de destacados" : "Marcar como destacado"
                      }
                      className={`p-2 rounded-md transition-colors ${
                        t.destacado
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {t.destacado ? <Star size={16} /> : <StarOff size={16} />}
                    </button>
                    <button
                      onClick={() => navigate(`/admin/testimonios/${t.id}`)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(t.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed">
                  {t.texto}
                </p>

                {t.foto_producto && (
                  <img
                    src={t.foto_producto}
                    alt="Pedido"
                    className="mt-3 w-32 h-32 object-cover rounded-md border border-gray-200"
                  />
                )}

                {confirmDelete === t.id && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
                    <p className="text-sm text-red-700">
                      ¿Eliminar este testimonio? No se puede deshacer.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}