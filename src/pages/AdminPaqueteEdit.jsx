import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle, CheckCircle, RotateCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getPaqueteByIdAdmin,
  updatePaqueteAdmin,
} from "../functions/getPaquetesAdmin";
import { getAllParfumsAdmin } from "../functions/getParfumsAdmin";
import { calcularPrecioDecant } from "../functions/pricingDecant";
import LoadingSpinner from "../ui/LoadingSpinner";
import ImageUploader from "../ui/ImageUploader";
import PerfumeSelector from "../ui/PerfumeSelector";

export default function AdminPaqueteEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(null);
  const [parfumsCatalog, setParfumsCatalog] = useState([]);
  const [precioIndividualEditadoManual, setPrecioIndividualEditadoManual] =
    useState(true); // En edición empieza como manual (preserva el valor existente)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paquete, parfums] = await Promise.all([
        getPaqueteByIdAdmin(id),
        getAllParfumsAdmin(),
      ]);
      if (!paquete) {
        setError("Paquete no encontrado");
        return;
      }
      setForm(paquete);
      setParfumsCatalog(parfums);
    } catch (err) {
      setError("Error al cargar el paquete");
    } finally {
      setLoading(false);
    }
  };

  // Calcular precio individual sumado (con factor Ensar Oud aplicado)
  const calcularPrecioIndividualAuto = (contenido) => {
    if (!contenido || contenido.length === 0) return "";
    if (parfumsCatalog.length === 0) return "";

    const parfumsById = {};
    parfumsCatalog.forEach((p) => {
      parfumsById[p.id] = p;
    });

    let total = 0;
    for (const item of contenido) {
      const parfum = parfumsById[item.parfumId];
      if (!parfum) continue;
      const ml = Number(item.mililitros) || 0;
      total += calcularPrecioDecant(parfum, ml);
    }

    return Math.round(total).toString();
  };

  // Auto-calcular precioIndividual cuando cambia contenido (si no fue editado manual)
  useEffect(() => {
    if (precioIndividualEditadoManual) return;
    if (!form) return;
    if (parfumsCatalog.length === 0) return;
    const auto = calcularPrecioIndividualAuto(form.contenido);
    setForm((prev) => ({ ...prev, precioIndividual: auto }));
  }, [
    form?.contenido,
    parfumsCatalog,
    precioIndividualEditadoManual,
  ]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Si cambió el contenido, reactivar cálculo automático del precio individual
    if (field === "contenido") {
      setPrecioIndividualEditadoManual(false);
    }
  };

  const handlePrecioIndividualChange = (value) => {
    setPrecioIndividualEditadoManual(true);
    handleChange("precioIndividual", value);
  };

  const handleResetPrecioIndividual = () => {
    setPrecioIndividualEditadoManual(false);
    const auto = calcularPrecioIndividualAuto(form.contenido);
    handleChange("precioIndividual", auto);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre?.trim()) {
      setError("El nombre del paquete es obligatorio.");
      return;
    }
    if (form.precio == null || isNaN(Number(form.precio))) {
      setError("Precio inválido.");
      return;
    }
    if (!form.contenido || form.contenido.length === 0) {
      setError("Agrega al menos un perfume al paquete.");
      return;
    }
    const itemsInvalidos = form.contenido.some(
      (i) => !i.mililitros || Number(i.mililitros) <= 0,
    );
    if (itemsInvalidos) {
      setError("Todos los perfumes deben tener cantidad de ml mayor a 0.");
      return;
    }

    // Validar que todos los items sean decants (no botellas)
    if (parfumsCatalog && parfumsCatalog.length > 0) {
      const parfumsById = {};
      parfumsCatalog.forEach((p) => {
        parfumsById[p.id] = p;
      });
      const tieneBotellas = form.contenido.some((i) => {
        const parfum = parfumsById[i.parfumId];
        return parfum && parfum.stock === true;
      });
      if (tieneBotellas) {
        setError(
          "Los paquetes solo pueden contener decants, no botellas completas.",
        );
        return;
      }
    }

    setSaving(true);
    try {
      const { id: _id, created_at, ...updates } = form;

      updates.precio = Number(updates.precio) || 0;
      updates.precioIndividual =
        updates.precioIndividual !== "" && updates.precioIndividual !== null
          ? Number(updates.precioIndividual) || null
          : null;
      updates.orden = Number(updates.orden) || 0;

      await updatePaqueteAdmin(id, updates);
      setSuccess(true);

      setTimeout(() => {
        navigate("/admin/paquetes");
      }, 800);
    } catch (err) {
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <AlertCircle className="text-red-500 mx-auto mb-3" size={32} />
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate("/admin/paquetes")}
            className="bg-[#A47E3B] text-white px-4 py-2 rounded-md hover:bg-[#D4AF7A]"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/paquetes")}
              className="p-2 hover:bg-gray-700 rounded-md transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">Editar paquete</h1>
              <p className="text-xs text-gray-400 truncate max-w-[200px] sm:max-w-none">
                {form.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || success}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              saving || success
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#A47E3B] hover:bg-[#D4AF7A]"
            }`}
          >
            {success ? <CheckCircle size={16} /> : <Save size={16} />}
            <span className="hidden sm:inline">
              {saving ? "Guardando..." : success ? "Guardado" : "Guardar"}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-4 flex items-center gap-2">
            <CheckCircle size={20} />
            Cambios guardados correctamente
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información básica
            </h2>

            <div className="space-y-4">
              <Field label="Nombre del paquete *">
                <input
                  type="text"
                  value={form.nombre || ""}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Descripción">
                <textarea
                  value={form.descripcion || ""}
                  onChange={(e) => handleChange("descripcion", e.target.value)}
                  rows="2"
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagen</h2>
            <ImageUploader
              value={form.imagen || ""}
              onChange={(newUrl) => handleChange("imagen", newUrl)}
            />
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Perfumes incluidos
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona del catálogo los perfumes que componen este paquete y
              cuántos ml de cada uno.
            </p>

            <PerfumeSelector
              value={form.contenido || []}
              onChange={(newContenido) =>
                handleChange("contenido", newContenido)
              }
            />
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Precio</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Precio del paquete *">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.precio ?? ""}
                  onChange={(e) => handleChange("precio", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Precio individual">
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.precioIndividual ?? ""}
                    onChange={(e) =>
                      handlePrecioIndividualChange(e.target.value)
                    }
                    className={`${inputClass} pr-10`}
                    placeholder="Calculado automáticamente"
                  />
                  <button
                    type="button"
                    onClick={handleResetPrecioIndividual}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#A47E3B] hover:bg-amber-50 rounded transition-colors"
                    title="Recalcular automáticamente"
                  >
                    <RotateCw size={14} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {precioIndividualEditadoManual
                    ? "Editable. Click en ↻ para recalcular automáticamente con los ml actuales."
                    : "Calculado automáticamente sumando precios × ml."}
                </p>
              </Field>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Visibilidad
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activo === true}
                  onChange={(e) => handleChange("activo", e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-[#A47E3B] focus:ring-[#A47E3B]"
                />
                <div>
                  <span className="text-gray-800 font-medium block">
                    Paquete activo
                  </span>
                  <span className="text-xs text-gray-500">
                    Si está activo y todos los perfumes están "Disponible", el
                    paquete se mostrará públicamente.
                  </span>
                </div>
              </label>

              <Field label="Orden de aparición">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.orden ?? 0}
                  onChange={(e) => handleChange("orden", e.target.value)}
                  className={`${inputClass} max-w-xs`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Menor número aparece primero.
                </p>
              </Field>
            </div>
          </section>

          <div className="sm:hidden">
            <button
              type="submit"
              disabled={saving || success}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                saving || success
                  ? "bg-gray-300 text-gray-500"
                  : "bg-[#A47E3B] text-white hover:bg-[#D4AF7A]"
              }`}
            >
              {saving
                ? "Guardando..."
                : success
                  ? "Guardado ✓"
                  : "Guardar cambios"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A47E3B] focus:border-[#A47E3B] outline-none transition";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}
