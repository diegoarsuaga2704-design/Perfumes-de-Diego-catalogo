import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Gift, Trash2 } from "lucide-react";
import {
  getRegalos,
  crearRegalos,
  actualizarRegalo,
  borrarRegalo,
} from "../functions/regalosCalendario";

const fechaHora = (iso) =>
  new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const FILTROS = [
  ["todos", "Todos", () => true],
  ["libres", "Sin canjear", (r) => !r.canjeado_en],
  ["por_entregar", "Por entregar", (r) => r.canjeado_en && !r.entregado],
  ["entregados", "Entregados", (r) => r.entregado],
];

const inputCls =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-base bg-white focus:ring-2 focus:ring-[#A47E3B] focus:outline-none";

// Regalos sorpresa del calendario de adviento: Diego crea los códigos con el
// premio de cada uno, los imprime y ve quién canjeó qué.
export default function AdminRegalosCalendario() {
  const navigate = useNavigate();
  const [regalos, setRegalos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [form, setForm] = useState({ cantidad: "1", premio: "", detalle: "" });
  const [creando, setCreando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [editando, setEditando] = useState(null); // { codigo, premio, detalle }

  const cargar = () =>
    getRegalos()
      .then(setRegalos)
      .catch(() => setError("No se pudieron cargar los regalos. ¿Ya corriste el SQL de regalos_calendario?"))
      .finally(() => setCargando(false));

  useEffect(() => {
    window.scrollTo(0, 0);
    cargar();
  }, []);

  const resumen = useMemo(() => {
    const m = new Map();
    for (const r of regalos) {
      const x = m.get(r.premio) || { premio: r.premio, total: 0, canjeados: 0 };
      x.total += 1;
      if (r.canjeado_en) x.canjeados += 1;
      m.set(r.premio, x);
    }
    return [...m.values()].sort((a, b) => a.total - b.total);
  }, [regalos]);

  const visibles = regalos.filter(FILTROS.find(([k]) => k === filtro)[2]);

  const crear = async (e) => {
    e.preventDefault();
    if (!form.premio.trim() || creando) return;
    setCreando(true);
    setError("");
    try {
      const nuevos = await crearRegalos(form.cantidad, form.premio, form.detalle);
      setRegalos((prev) => [...nuevos, ...prev]);
      setAviso(`Listo: ${nuevos.length} código${nuevos.length === 1 ? "" : "s"} de "${form.premio.trim()}".`);
      setForm({ cantidad: "1", premio: "", detalle: "" });
    } catch {
      setError("No se pudieron crear los códigos. Intenta de nuevo.");
    } finally {
      setCreando(false);
    }
  };

  const copiar = async (lista) => {
    const texto = lista.map((r) => `${r.codigo} · ${r.premio}`).join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setAviso(`Copié ${lista.length} código${lista.length === 1 ? "" : "s"} (código · premio).`);
    } catch {
      setAviso("No se pudo copiar. Mantén presionado y copia a mano.");
    }
  };

  const cambiar = async (codigo, cambios) => {
    const previo = regalos.find((r) => r.codigo === codigo);
    setRegalos((prev) => prev.map((r) => (r.codigo === codigo ? { ...r, ...cambios } : r)));
    try {
      await actualizarRegalo(codigo, cambios);
    } catch {
      setError("No se pudo guardar el cambio.");
      setRegalos((prev) => prev.map((r) => (r.codigo === codigo ? previo : r)));
    }
  };

  const borrar = async (r) => {
    if (!window.confirm(`¿Borrar el código ${r.codigo} (${r.premio})?`)) return;
    try {
      await borrarRegalo(r.codigo);
      setRegalos((prev) => prev.filter((x) => x.codigo !== r.codigo));
    } catch {
      setError("No se pudo borrar.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-30 bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-2">
          <button onClick={() => navigate("/admin")} aria-label="Regresar" className="p-2 hover:bg-gray-700 rounded-md">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold">Regalos del calendario</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4">
        {/* Crear códigos */}
        <form onSubmit={crear} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="font-semibold text-gray-900">Crear códigos</p>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <label className="block">
              <span className="text-xs text-gray-600">Cuántos</span>
              <input
                value={form.cantidad}
                onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                inputMode="numeric"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600">Premio</span>
              <input
                value={form.premio}
                onChange={(e) => setForm((f) => ({ ...f, premio: e.target.value }))}
                placeholder="Ej. Envío gratis en tu siguiente pedido"
                className={inputCls}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-gray-600">Detalle para el cliente (opcional)</span>
            <input
              value={form.detalle}
              onChange={(e) => setForm((f) => ({ ...f, detalle: e.target.value }))}
              placeholder="Ej. Usa el cupón NAVIDAD15 · válido hasta el 31 de enero"
              className={inputCls}
            />
          </label>
          <button
            type="submit"
            disabled={!form.premio.trim() || creando}
            className="w-full py-2.5 rounded-md bg-[#A47E3B] text-white font-semibold disabled:opacity-50"
          >
            {creando ? "Creando…" : `Crear ${form.cantidad || 1} código${form.cantidad === "1" ? "" : "s"}`}
          </button>
        </form>

        {aviso && <p className="text-sm text-green-700">{aviso}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Resumen por premio */}
        {resumen.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-2">Premios</p>
            <ul className="text-sm space-y-1">
              {resumen.map((x) => (
                <li key={x.premio} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">{x.premio}</span>
                  <span className="whitespace-nowrap text-gray-600">
                    {x.total} código{x.total === 1 ? "" : "s"} · {x.canjeados} canjeado{x.canjeados === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FILTROS.map(([k, t, f]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFiltro(k)}
              className={`py-2 rounded-md border text-sm font-semibold ${
                filtro === k ? "bg-[#A47E3B] border-[#A47E3B] text-white" : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              {t} ({regalos.filter(f).length})
            </button>
          ))}
        </div>

        {visibles.length > 0 && (
          <button
            type="button"
            onClick={() => copiar(visibles)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#A47E3B]"
          >
            <Copy size={16} /> Copiar {visibles.length === 1 ? "este código" : `estos ${visibles.length} códigos`} para imprimir
          </button>
        )}

        {cargando && <p className="text-sm text-gray-500">Cargando…</p>}
        {!cargando && visibles.length === 0 && !error && (
          <p className="text-sm text-gray-500 bg-white rounded-lg border border-gray-200 p-4">No hay códigos aquí.</p>
        )}

        <ul className="space-y-2">
          {visibles.map((r) => {
            const enEdicion = editando?.codigo === r.codigo;
            return (
              <li key={r.codigo} className="bg-white rounded-xl border border-gray-200 p-3 space-y-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-gray-900 tracking-wider">{r.codigo}</p>
                    {!enEdicion && (
                      <>
                        <p className="text-gray-800 flex items-center gap-1.5">
                          <Gift size={14} className="text-[#A47E3B] shrink-0" /> {r.premio}
                        </p>
                        {r.detalle && <p className="text-xs text-gray-500">{r.detalle}</p>}
                      </>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                      r.entregado
                        ? "bg-emerald-100 text-emerald-800"
                        : r.canjeado_en
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {r.entregado ? "Entregado" : r.canjeado_en ? "Canjeado" : "Sin canjear"}
                  </span>
                </div>

                {enEdicion && (
                  <div className="space-y-2">
                    <input
                      value={editando.premio}
                      onChange={(e) => setEditando((x) => ({ ...x, premio: e.target.value }))}
                      className={inputCls}
                    />
                    <input
                      value={editando.detalle || ""}
                      onChange={(e) => setEditando((x) => ({ ...x, detalle: e.target.value }))}
                      placeholder="Detalle (opcional)"
                      className={inputCls}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!editando.premio.trim()}
                        onClick={() => {
                          cambiar(r.codigo, { premio: editando.premio.trim(), detalle: editando.detalle?.trim() || null });
                          setEditando(null);
                        }}
                        className="flex-1 py-2 rounded-md bg-[#A47E3B] text-white font-semibold disabled:opacity-50"
                      >
                        Guardar
                      </button>
                      <button type="button" onClick={() => setEditando(null)} className="flex-1 py-2 rounded-md border border-gray-300">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {r.canjeado_en && (
                  <div className="rounded-md bg-gray-50 border border-gray-200 p-2.5 space-y-1.5">
                    <p className="text-gray-700">
                      <span className="font-semibold">{r.nombre}</span> · {fechaHora(r.canjeado_en)}
                    </p>
                    <a
                      href={`https://wa.me/52${r.telefono}?text=${encodeURIComponent(
                        `Hola ${String(r.nombre || "").split(" ")[0]}, soy Diego de Perfumes de Diego. ¡Felicidades por tu regalo del calendario: ${r.premio}! Te escribo para entregártelo.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-3 py-1.5 rounded-md bg-green-600 text-white font-semibold"
                    >
                      Escribirle · {r.telefono}
                    </a>
                    <label className="flex items-center gap-2 text-gray-700">
                      <input
                        type="checkbox"
                        checked={!!r.entregado}
                        onChange={(e) => cambiar(r.codigo, { entregado: e.target.checked })}
                        className="w-4 h-4 accent-[#A47E3B]"
                      />
                      Ya se lo entregué
                    </label>
                  </div>
                )}

                {!r.canjeado_en && !enEdicion && (
                  <div className="flex gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditando({ codigo: r.codigo, premio: r.premio, detalle: r.detalle || "" })}
                      className="font-semibold text-[#A47E3B]"
                    >
                      Cambiar premio
                    </button>
                    <button type="button" onClick={() => borrar(r)} className="inline-flex items-center gap-1 text-red-600">
                      <Trash2 size={13} /> Borrar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
