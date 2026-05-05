import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  getTestimonioById,
  updateTestimonio,
} from "../functions/getTestimonios";
import ImageUploader from "../ui/ImageUploader";

export default function AdminTestimonioEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getTestimonioById(id);
        setForm({
          nombre: data.nombre || "",
          texto: data.texto || "",
          foto_cliente: data.foto_cliente || "",
          destacado: data.destacado || false,
        });
      } catch (err) {
        setError("No se pudo cargar el testimonio.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim() || !form.texto.trim()) {
      setError("El nombre y el testimonio son obligatorios.");
      return;
    }

    try {
      setSaving(true);
      await updateTestimonio(id, {
        nombre: form.nombre.trim(),
        texto: form.texto.trim(),
        foto_cliente: form.foto_cliente.trim() || null,
        destacado: form.destacado,
      });
      navigate("/admin/testimonios");
    } catch (err) {
      setError("Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-600">Testimonio no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/testimonios")}
            className="flex items-center gap-2 hover:text-[#D4AF7A] transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Volver</span>
          </button>
          <h1 className="text-lg sm:text-xl font-bold">Editar testimonio</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md p-6 sm:p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre del cliente
            </label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Testimonio
            </label>
            <textarea
              name="texto"
              value={form.texto}
              onChange={handleChange}
              rows={5}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#A47E3B] focus:outline-none resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Foto del cliente <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <ImageUploader
              value={form.foto_cliente}
              onChange={(url) =>
                setForm((prev) => ({ ...prev, foto_cliente: url }))
              }
              bucket="testimoniosImages"
            />
            <p className="text-xs text-gray-500 mt-2">
              Si está vacío, se usa avatar con la inicial del nombre.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="destacado"
              name="destacado"
              checked={form.destacado}
              onChange={handleChange}
              className="w-4 h-4 accent-[#A47E3B]"
            />
            <label htmlFor="destacado" className="text-sm text-gray-700">
              Destacado (aparece en home)
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/admin/testimonios")}
              className="px-5 py-2 border border-gray-300 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-6 py-2 rounded-md text-sm font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}