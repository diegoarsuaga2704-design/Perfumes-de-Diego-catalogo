import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Loader2,
  Undo2,
  X,
} from "lucide-react";
import {
  getAllDecantsParciales,
  createDecantParcial,
  updateDecantParcial,
  deleteDecantParcial,
} from "../functions/getDecantsParciales";
import {
  getClientesConStats,
  createClienteAdmin,
} from "../functions/getClientesAdmin";
import ClienteCombobox from "../ui/ClienteCombobox";

const PAGE_SIZE = 300;
const MAX_UNDO = 30;

export default function AdminDecantsParciales() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [confirmarBorrar, setConfirmarBorrar] = useState(null);
  const [page, setPage] = useState(0);
  const [historial, setHistorial] = useState([]);
  const historialRef = useRef([]);
  historialRef.current = historial;
  const editTimestampRef = useRef({});

  const [busqueda, setBusqueda] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");
  const [filtroMes, setFiltroMes] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [d, cli] = await Promise.all([
        getAllDecantsParciales(),
        getClientesConStats(),
      ]);
      setItems(d);
      setClientes(cli);
    } catch (err) {
      console.error(err);
      alert("Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  // Ctrl+Z global
  useEffect(() => {
    function handler(e) {
      const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
      if (!isUndo) return;
      const tag = e.target?.tagName?.toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      handleUndo();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  async function handleUndo() {
    const h = historialRef.current;
    if (h.length === 0) return;
    const ultimo = h[h.length - 1];
    setHistorial((prev) => prev.slice(0, -1));
    try {
      const actualizado = await updateDecantParcial(
        ultimo.id,
        ultimo.valoresAnteriores,
      );
      setItems((prev) => prev.map((it) => (it.id === ultimo.id ? actualizado : it)));
    } catch (err) {
      console.error(err);
      alert("Error al deshacer.");
    }
  }

  async function handleCreateCliente(nombre) {
    const nuevo = await createClienteAdmin({ nombre });
    setClientes((prev) =>
      [
        ...prev,
        {
          ...nuevo,
          cantidad_botellas: 0,
          cantidad_decants: 0,
          total_comprado: 0,
        },
      ].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );
    return nuevo;
  }

  async function handleEdit(id, field, value) {
    const fila = items.find((it) => it.id === id);
    if (!fila) return;

    const key = `${id}_${field}`;
    const ts = Date.now();
    editTimestampRef.current[key] = ts;

    const valoresAnteriores = { [field]: fila[field] ?? null };
    setHistorial((prev) => [
      ...prev.slice(-(MAX_UNDO - 1)),
      { id, valoresAnteriores },
    ]);

    // Optimistic
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
    setSaving((prev) => ({ ...prev, [id]: true }));

    try {
      const actualizado = await updateDecantParcial(id, { [field]: value });
      if (editTimestampRef.current[key] !== ts) return;
      setItems((prev) =>
        prev.map((it) => (it.id === id ? actualizado : it)),
      );
    } catch (err) {
      if (editTimestampRef.current[key] !== ts) return;
      console.error(err);
      alert("Error al guardar.");
      setItems((prev) => prev.map((it) => (it.id === id ? fila : it)));
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleNueva() {
    try {
      const hoy = new Date().toISOString().slice(0, 10);
      const nueva = await createDecantParcial({ fecha: hoy, monto: 0 });
      setItems((prev) => [nueva, ...prev]);
      setPage(0);
    } catch (err) {
      console.error(err);
      alert("Error al crear.");
    }
  }

  async function handleEliminar(id) {
    try {
      await deleteDecantParcial(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      setConfirmarBorrar(null);
    } catch (err) {
      console.error(err);
      alert("Error al borrar.");
    }
  }

  const filtrados = useMemo(() => {
    return items.filter((it) => {
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const nombreCli = it.clientes_admin?.nombre || "";
        const clienteTexto = it.cliente_texto || "";
        const notas = it.notas || "";
        if (
          !nombreCli.toLowerCase().includes(q) &&
          !clienteTexto.toLowerCase().includes(q) &&
          !notas.toLowerCase().includes(q)
        )
          return false;
      }
      if (filtroCliente === "__sin__") {
        if (it.cliente_id) return false;
      } else if (filtroCliente && String(it.cliente_id) !== filtroCliente) {
        return false;
      }
      if (filtroAnio && it.fecha) {
        if (String(it.fecha).slice(0, 4) !== filtroAnio) return false;
      }
      if (filtroMes && it.fecha) {
        if (String(it.fecha).slice(5, 7) !== filtroMes) return false;
      }
      return true;
    });
  }, [items, busqueda, filtroCliente, filtroAnio, filtroMes]);

  useEffect(() => {
    setPage(0);
  }, [busqueda, filtroCliente, filtroAnio, filtroMes]);

  const paginados = filtrados.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));

  const stats = useMemo(() => {
    let total = 0,
      conCliente = 0;
    filtrados.forEach((it) => {
      if (it.monto) total += Number(it.monto);
      if (it.cliente_id) conCliente++;
    });
    return {
      cantidad: filtrados.length,
      total,
      sinCliente: filtrados.length - conCliente,
    };
  }, [filtrados]);

  const aniosDisponibles = useMemo(() => {
    const set = new Set();
    items.forEach((it) => {
      if (it.fecha) set.add(String(it.fecha).slice(0, 4));
    });
    return Array.from(set).sort().reverse();
  }, [items]);

  const formatMoney = (n) =>
    n == null
      ? ""
      : "$" + Math.round(Number(n)).toLocaleString("es-MX");

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 hover:text-[#D4AF7A] transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm hidden sm:inline">Volver</span>
          </button>
          <h1 className="text-base sm:text-lg font-bold">
            Decants y parciales
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historial.length === 0}
              className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-md text-sm"
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 size={14} />
              <span className="hidden sm:inline">
                Deshacer ({historial.length})
              </span>
            </button>
            <button
              onClick={handleNueva}
              className="flex items-center gap-1 bg-[#A47E3B] hover:bg-[#D4AF7A] px-3 py-1.5 rounded-md text-sm font-semibold"
            >
              <Plus size={14} />
              Nueva
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-full px-3 sm:px-6 py-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Buscar cliente o nota..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#A47E3B] focus:outline-none"
              />
            </div>
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="border border-gray-300 rounded py-1.5 px-2 text-xs"
            >
              <option value="">Todos los clientes</option>
              <option value="__sin__">Sin cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(e.target.value)}
              className="border border-gray-300 rounded py-1.5 px-2 text-xs"
            >
              <option value="">Todos los años</option>
              {aniosDisponibles.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="border border-gray-300 rounded py-1.5 px-2 text-xs"
            >
              <option value="">Todos los meses</option>
              <option value="01">Enero</option>
              <option value="02">Febrero</option>
              <option value="03">Marzo</option>
              <option value="04">Abril</option>
              <option value="05">Mayo</option>
              <option value="06">Junio</option>
              <option value="07">Julio</option>
              <option value="08">Agosto</option>
              <option value="09">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-3 flex flex-wrap gap-4 text-xs">
          <div>
            <span className="text-gray-500">Ventas:</span>{" "}
            <strong className="text-gray-900">{stats.cantidad}</strong>
          </div>
          <div>
            <span className="text-gray-500">Sin cliente:</span>{" "}
            <strong className="text-orange-600">{stats.sinCliente}</strong>
          </div>
          <div>
            <span className="text-gray-500">Total:</span>{" "}
            <strong className="text-green-700">
              {formatMoney(stats.total)}
            </strong>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Cargando...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-gray-500 py-12">Sin resultados.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center">
                <thead className="bg-gray-100 border-b border-gray-300 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 font-semibold text-gray-700">
                      Fecha
                    </th>
                    <th className="px-2 py-2 font-semibold text-gray-700">
                      Cliente
                    </th>
                    <th className="px-2 py-2 font-semibold text-gray-700">
                      Monto
                    </th>
                    <th className="px-2 py-2 font-semibold text-gray-700 text-left">
                      Notas
                    </th>
                    <th className="px-2 py-2 font-semibold text-gray-700 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((it) => (
                    <FilaDecant
                      key={it.id}
                      item={it}
                      clientes={clientes}
                      isSaving={!!saving[it.id]}
                      onEdit={handleEdit}
                      onCreateCliente={handleCreateCliente}
                      onDelete={() => setConfirmarBorrar(it.id)}
                      confirmarBorrar={confirmarBorrar === it.id}
                      onConfirmDelete={() => handleEliminar(it.id)}
                      onCancelDelete={() => setConfirmarBorrar(null)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && filtrados.length > PAGE_SIZE && (
          <div className="flex justify-center items-center gap-2 mt-4 text-sm">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
            >
              ← Anterior
            </button>
            <span className="text-gray-700">
              Página {page + 1} de {totalPaginas}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPaginas - 1, page + 1))}
              disabled={page >= totalPaginas - 1}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Siguiente →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function FilaDecant({
  item,
  clientes,
  isSaving,
  onEdit,
  onCreateCliente,
  onDelete,
  confirmarBorrar,
  onConfirmDelete,
  onCancelDelete,
}) {
  const cellInput =
    "w-full px-1 py-0.5 border border-transparent hover:border-gray-300 focus:border-[#A47E3B] rounded text-xs text-center bg-transparent";

  return (
    <tr
      className={`border-b border-gray-200 hover:bg-blue-50/40 ${
        !item.cliente_id ? "bg-orange-50" : "bg-white"
      }`}
    >
      <td className="px-1 py-1">
        <input
          type="date"
          defaultValue={item.fecha || ""}
          onBlur={(e) => {
            if (e.target.value !== (item.fecha || ""))
              onEdit(item.id, "fecha", e.target.value || null);
          }}
          className={`${cellInput} w-32`}
        />
      </td>
      <td className="px-1 py-1">
        <ClienteCombobox
          value={item.cliente_id}
          clientes={clientes}
          onChange={(id) => onEdit(item.id, "cliente_id", id)}
          onCreateNew={onCreateCliente}
        />
        {!item.cliente_id && item.cliente_texto && (
          <div className="text-[10px] text-gray-500 italic mt-0.5">
            texto libre: {item.cliente_texto}
          </div>
        )}
      </td>
      <td className="px-1 py-1">
        <div className="relative inline-block">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
            $
          </span>
          <input
            type="number"
            step="0.01"
            defaultValue={item.monto ?? ""}
            onBlur={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              if (v !== item.monto) onEdit(item.id, "monto", v);
            }}
            className={`${cellInput} w-24 pl-4 no-spinner`}
          />
        </div>
      </td>
      <td className="px-1 py-1 text-left">
        <input
          type="text"
          defaultValue={item.notas || ""}
          placeholder="ej: 5 ml de Naxos"
          onBlur={(e) => {
            if (e.target.value !== (item.notas || ""))
              onEdit(item.id, "notas", e.target.value || null);
          }}
          className={`${cellInput} w-full text-left`}
        />
      </td>
      <td className="px-1 py-1 w-10">
        {isSaving ? (
          <Loader2 className="animate-spin text-gray-400 mx-auto" size={12} />
        ) : confirmarBorrar ? (
          <div className="flex gap-0.5 justify-center">
            <button
              onClick={onConfirmDelete}
              className="text-red-600 hover:text-red-800 text-xs font-bold px-1"
              title="Confirmar"
            >
              ✓
            </button>
            <button
              onClick={onCancelDelete}
              className="text-gray-500 hover:text-gray-700 text-xs px-1"
              title="Cancelar"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Borrar"
          >
            <Trash2 size={12} />
          </button>
        )}
      </td>
    </tr>
  );
}
