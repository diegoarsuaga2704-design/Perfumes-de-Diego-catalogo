import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, X, Search } from "lucide-react";
import {
  getProveedoresConConteo,
  createProveedor,
  updateProveedor,
  deleteProveedor,
} from "../functions/getProveedores";

export default function AdminProveedoresList() {
  const navigate = useNavigate();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: "", notas: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmarBorrar, setConfirmarBorrar] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getProveedoresConConteo();
      setProveedores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function abrirCrear() {
    setEditing(null);
    setForm({ nombre: "", notas: "" });
    setError(null);
    setModalOpen(true);
  }

  function abrirEditar(prov) {
    setEditing(prov);
    setForm({ nombre: prov.nombre, notas: prov.notas || "" });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateProveedor(editing.id, form);
      } else {
        await createProveedor(form);
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      if (err.code === "23505") {
        setError("Ya existe un proveedor con ese nombre.");
      } else {
        setError("Error al guardar. Intenta de nuevo.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEliminar(prov) {
    if (prov.cantidad_pedidos > 0) {
      alert(
        `No se puede borrar "${prov.nombre}" porque tiene ${prov.cantidad_pedidos} pedidos asociados.`,
      );
      return;
    }
    try {
      await deleteProveedor(prov.id);
      setConfirmarBorrar(null);
      await fetchData();
    } catch {
      alert("Error al borrar.");
    }
  }

  const filtrados = proveedores.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()),
  );

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
            Proveedores ({proveedores.length})
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A47E3B] focus:outline-none text-sm"
            />
          </div>
          <button
            onClick={abrirCrear}
            className="flex items-center justify-center gap-2 bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-5 py-2 rounded-md text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Agregar proveedor
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Cargando...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            {busqueda ? "Sin coincidencias." : "No hay proveedores."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtrados.map((prov) => (
              <div
                key={prov.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {prov.nombre}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {prov.cantidad_pedidos}{" "}
                      {prov.cantidad_pedidos === 1 ? "botella" : "botellas"}
                    </p>
                  </div>
                </div>
                {prov.notas && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {prov.notas}
                  </p>
                )}
                {confirmarBorrar === prov.id ? (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEliminar(prov)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100"
                    >
                      Confirmar borrar
                    </button>
                    <button
                      onClick={() => setConfirmarBorrar(null)}
                      className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2 justify-end">
                    <button
                      onClick={() => abrirEditar(prov)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    {prov.cantidad_pedidos === 0 && (
                      <button
                        onClick={() => setConfirmarBorrar(prov.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100"
                      >
                        <Trash2 size={12} />
                        Borrar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? "Editar proveedor" : "Agregar proveedor"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {error}
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#A47E3B] hover:bg-[#D4AF7A] text-white rounded-md text-sm font-semibold disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}