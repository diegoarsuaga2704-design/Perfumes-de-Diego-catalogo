import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Search, Loader2, Undo2, X, CheckSquare } from "lucide-react";
import {
  getAllPedidosBotellas,
  updatePedidoBotella,
  createPedidoBotella,
  deletePedidoBotella,
  recalcularDependientes,
} from "../functions/getPedidosBotellas";
import { getProveedoresConConteo } from "../functions/getProveedores";
import {
  getClientesConStats,
  createClienteAdmin,
} from "../functions/getClientesAdmin";
import { getAllParfumsAdmin } from "../functions/getParfumsAdmin";
import ClienteCombobox from "../ui/ClienteCombobox";
import PerfumeCombobox from "../ui/PerfumeCombobox";

const PAGE_SIZE = 300;
const MAX_UNDO = 30;

export default function AdminPedidosBotellas() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [confirmarBorrar, setConfirmarBorrar] = useState(null);
  const [page, setPage] = useState(0);
  const [historial, setHistorial] = useState([]);
  const historialRef = useRef([]);
  historialRef.current = historial;

  // Selección masiva
  const [seleccionadas, setSeleccionadas] = useState(new Set());
  const [bulkClienteModal, setBulkClienteModal] = useState(false);
  const allSelectedRef = useRef(null);

  // Drag-to-mark en checkboxes (Avisado/Recibido/Entregado)
  const dragStateRef = useRef(null);
  // dragStateRef.current = null | { field, value, ids: Set, valoresAnteriores: Map }

  const [busqueda, setBusqueda] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [p, prov, cli, par] = await Promise.all([
        getAllPedidosBotellas(),
        getProveedoresConConteo(),
        getClientesConStats(),
        getAllParfumsAdmin(),
      ]);
      setPedidos(p);
      setProveedores(prov);
      setClientes(cli);
      setParfums(par);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Ctrl+Z global. Solo aplica si NO estás dentro de un input.
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

  // Handlers drag-to-mark
  function handleCheckboxMouseDown(id, field, currentValue) {
    const newValue = !currentValue;
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: newValue } : p)),
    );
    dragStateRef.current = {
      field,
      value: newValue,
      ids: new Set([id]),
      valoresAnteriores: new Map([[id, { [field]: currentValue ?? null }]]),
    };
  }

  function handleCheckboxMouseEnter(id, field, currentValue) {
    const drag = dragStateRef.current;
    if (!drag || drag.field !== field) return;
    if (drag.ids.has(id)) return;
    if (currentValue === drag.value) {
      drag.ids.add(id);
      return;
    }
    // Para entregado_a_cliente=true, solo aplicar si tiene cliente
    if (field === "entregado_a_cliente" && drag.value === true) {
      const fila = pedidos.find((p) => p.id === id);
      if (!fila?.cliente_id) {
        drag.ids.add(id);
        return;
      }
    }
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: drag.value } : p)),
    );
    drag.ids.add(id);
    drag.valoresAnteriores.set(id, { [field]: currentValue ?? null });
  }

  // Listener global de mouseup: termina el drag y persiste los cambios
  useEffect(() => {
    async function handleMouseUp() {
      const drag = dragStateRef.current;
      if (!drag) return;
      dragStateRef.current = null;

      // Filtrar solo los que realmente cambiaron (los que tenían un valor anterior)
      const idsCambiados = [...drag.ids].filter((id) =>
        drag.valoresAnteriores.has(id),
      );
      if (idsCambiados.length === 0) return;

      // Registrar en historial como batch
      const items = idsCambiados.map((id) => ({
        id,
        valoresAnteriores: drag.valoresAnteriores.get(id),
      }));
      setHistorial((prev) => [
        ...prev.slice(-(MAX_UNDO - 1)),
        { isBatch: true, items },
      ]);

      // Persistir
      setSaving((prev) => {
        const next = { ...prev };
        idsCambiados.forEach((id) => {
          next[id] = true;
        });
        return next;
      });

      try {
        await Promise.all(
          idsCambiados.map((id) =>
            updatePedidoBotella(id, { [drag.field]: drag.value }),
          ),
        );
      } catch (err) {
        console.error("Error guardando drag:", err);
        alert("Error guardando algunos cambios. Recarga la página.");
      } finally {
        setSaving((prev) => {
          const next = { ...prev };
          idsCambiados.forEach((id) => {
            next[id] = false;
          });
          return next;
        });
      }
    }
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [pedidos]);

  // Estado indeterminate del checkbox "Seleccionar todo" del header
  useEffect(() => {
    if (!allSelectedRef.current) return;
    const visibles = paginados.length;
    const seleccionadasVisibles = paginados.filter((p) =>
      seleccionadas.has(p.id),
    ).length;
    allSelectedRef.current.indeterminate =
      seleccionadasVisibles > 0 && seleccionadasVisibles < visibles;
  });

  async function handleUndo() {
    const h = historialRef.current;
    if (h.length === 0) return;
    const ultimo = h[h.length - 1];
    setHistorial((prev) => prev.slice(0, -1));
    try {
      if (ultimo.isBatch) {
        await Promise.all(
          ultimo.items.map((item) =>
            updatePedidoBotella(item.id, item.valoresAnteriores),
          ),
        );
        setPedidos((prev) =>
          prev.map((p) => {
            const item = ultimo.items.find((i) => i.id === p.id);
            return item ? { ...p, ...item.valoresAnteriores } : p;
          }),
        );
      } else {
        await updatePedidoBotella(ultimo.id, ultimo.valoresAnteriores);
        setPedidos((prev) =>
          prev.map((p) =>
            p.id === ultimo.id ? { ...p, ...ultimo.valoresAnteriores } : p,
          ),
        );
      }
    } catch (err) {
      console.error("Error en undo:", err);
      alert("Error al deshacer.");
    }
  }

  // ===== Selección masiva =====

  function toggleSeleccion(id) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSeleccionarTodosVisibles(checked) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (checked) paginados.forEach((p) => next.add(p.id));
      else paginados.forEach((p) => next.delete(p.id));
      return next;
    });
  }

  async function handleBulkUpdate(field, value) {
    if (seleccionadas.size === 0) return;
    let idsAfectados = [...seleccionadas];

    // Para "entregado a cliente=true" solo aplicar a las que tienen cliente
    if (field === "entregado_a_cliente" && value === true) {
      idsAfectados = idsAfectados.filter((id) => {
        const p = pedidos.find((x) => x.id === id);
        return p && p.cliente_id;
      });
      if (idsAfectados.length === 0) {
        alert(
          "Ninguna de las botellas seleccionadas tiene cliente asignado. Asigna cliente primero.",
        );
        return;
      }
    }

    const items = idsAfectados.map((id) => {
      const fila = pedidos.find((p) => p.id === id);
      return { id, valoresAnteriores: { [field]: fila[field] ?? null } };
    });

    setHistorial((prev) => [
      ...prev.slice(-(MAX_UNDO - 1)),
      { isBatch: true, items },
    ]);

    setPedidos((prev) =>
      prev.map((p) =>
        idsAfectados.includes(p.id) ? { ...p, [field]: value } : p,
      ),
    );

    setSaving((prev) => {
      const next = { ...prev };
      idsAfectados.forEach((id) => {
        next[id] = true;
      });
      return next;
    });

    try {
      await Promise.all(
        idsAfectados.map((id) => updatePedidoBotella(id, { [field]: value })),
      );
    } catch (err) {
      console.error("Error en bulk update:", err);
      alert("Algunos cambios pueden no haberse guardado. Recarga la página.");
    } finally {
      setSaving((prev) => {
        const next = { ...prev };
        idsAfectados.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      setSeleccionadas(new Set());
    }
  }

  async function handleBulkDelete() {
    if (seleccionadas.size === 0) return;
    const confirmar = window.confirm(
      `¿Borrar ${seleccionadas.size} botellas? Esta acción NO se puede deshacer con Ctrl+Z.`,
    );
    if (!confirmar) return;

    const ids = [...seleccionadas];
    try {
      await Promise.all(ids.map((id) => deletePedidoBotella(id)));
      setPedidos((prev) => prev.filter((p) => !ids.includes(p.id)));
      setSeleccionadas(new Set());
    } catch (err) {
      console.error(err);
      alert("Error borrando algunas filas. Recarga la página.");
    }
  }

  const filtrados = useMemo(() => {
    return pedidos.filter((p) => {
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const matchPerfume = (p.perfume_nombre || "").toLowerCase().includes(q);
        const matchOrden = (p.numero_orden || "").toLowerCase().includes(q);
        if (!matchPerfume && !matchOrden) return false;
      }
      if (filtroProveedor && String(p.proveedor_id) !== filtroProveedor) return false;
      if (filtroCliente === "__sin__") {
        if (p.cliente_id) return false;
      } else if (filtroCliente && String(p.cliente_id) !== filtroCliente) {
        return false;
      }
      if (filtroEstado === "avisado_no" && p.avisado_proveedor) return false;
      if (filtroEstado === "recibido_no" && p.recibido_por_mi) return false;
      if (filtroEstado === "recibido_si" && !p.recibido_por_mi) return false;
      if (filtroEstado === "entregado_si" && !p.entregado_a_cliente) return false;
      if (filtroEstado === "entregado_no" && p.entregado_a_cliente) return false;
      if (filtroEstado === "sin_cliente" && p.cliente_id) return false;
      if (filtroAnio && p.fecha) {
        const anio = String(p.fecha).slice(0, 4);
        if (anio !== filtroAnio) return false;
      }
      return true;
    });
  }, [pedidos, busqueda, filtroProveedor, filtroCliente, filtroEstado, filtroAnio]);

  useEffect(() => {
    setPage(0);
  }, [busqueda, filtroProveedor, filtroCliente, filtroEstado, filtroAnio]);

  const paginados = filtrados.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));

  // Mapa de color por orden única (alternado, basado en página actual)
  const ordenColorMap = useMemo(() => {
    const m = {};
    let toggle = false;
    let prevOrden = null;
    paginados.forEach((p) => {
      const ord = p.numero_orden || `__sin__${p.id}`;
      if (ord !== prevOrden) {
        toggle = !toggle;
        prevOrden = ord;
      }
      m[p.id] = toggle;
    });
    return m;
  }, [paginados]);

  const stats = useMemo(() => {
    let totalSell = 0, totalBuy = 0, totalRevenue = 0, conCliente = 0;
    filtrados.forEach((p) => {
      if (p.sell) totalSell += Number(p.sell);
      if (p.buy_total) totalBuy += Number(p.buy_total);
      if (p.revenue) totalRevenue += Number(p.revenue);
      if (p.cliente_id) conCliente++;
    });
    return { total: filtrados.length, totalSell, totalBuy, totalRevenue, sinCliente: filtrados.length - conCliente };
  }, [filtrados]);

  const aniosDisponibles = useMemo(() => {
    const set = new Set();
    pedidos.forEach((p) => {
      if (p.fecha) set.add(String(p.fecha).slice(0, 4));
    });
    return Array.from(set).sort().reverse();
  }, [pedidos]);

  async function handleEdit(id, field, value) {
    const fila = pedidos.find((p) => p.id === id);
    if (!fila) return;
    const calc = recalcularDependientes(fila, field, value);
    const updates = { [field]: value, ...calc };

    const valoresAnteriores = {};
    for (const key of Object.keys(updates)) {
      valoresAnteriores[key] = fila[key] ?? null;
    }
    setHistorial((prev) => [...prev.slice(-(MAX_UNDO - 1)), { id, valoresAnteriores }]);

    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    setSaving((prev) => ({ ...prev, [id]: true }));

    try {
      await updatePedidoBotella(id, updates);
    } catch (err) {
      console.error("Error guardando:", err);
      alert("Error al guardar. Recarga la página.");
      setPedidos((prev) => prev.map((p) => (p.id === id ? fila : p)));
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  }

  // Nombres únicos de perfumes en el historial (para sugerencias)
  const historicoNombres = useMemo(() => {
    const set = new Set();
    pedidos.forEach((p) => {
      if (p.perfume_nombre && p.perfume_nombre.trim() && p.perfume_nombre !== "(sin nombre)") {
        set.add(p.perfume_nombre.trim());
      }
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [pedidos]);

  // Actualiza perfume_nombre + parfum_id en una sola operación
  async function handlePerfumeChange(id, nombre, parfumIdNuevo) {
    const fila = pedidos.find((p) => p.id === id);
    if (!fila) return;

    const updates = {
      perfume_nombre: nombre || "(sin nombre)",
      parfum_id: parfumIdNuevo,
    };

    // Si nada cambió, no hacer nada
    if (
      updates.perfume_nombre === fila.perfume_nombre &&
      updates.parfum_id === fila.parfum_id
    ) {
      return;
    }

    const valoresAnteriores = {
      perfume_nombre: fila.perfume_nombre ?? null,
      parfum_id: fila.parfum_id ?? null,
    };

    setHistorial((prev) => [
      ...prev.slice(-(MAX_UNDO - 1)),
      { id, valoresAnteriores },
    ]);

    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
    setSaving((prev) => ({ ...prev, [id]: true }));

    try {
      await updatePedidoBotella(id, updates);
    } catch (err) {
      console.error("Error guardando perfume:", err);
      alert("Error al guardar.");
      setPedidos((prev) => prev.map((p) => (p.id === id ? fila : p)));
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleCreateCliente(nombre) {
    const nuevo = await createClienteAdmin({ nombre });
    setClientes((prev) =>
      [...prev, { ...nuevo, cantidad_botellas: 0, cantidad_decants: 0, total_comprado: 0 }]
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );
    return nuevo;
  }

  async function handleNueva() {
    try {
      const nueva = await createPedidoBotella({
        perfume_nombre: "(nuevo)",
        avisado_proveedor: false,
        recibido_por_mi: false,
        entregado_a_cliente: false,
      });
      setPedidos((prev) => [nueva, ...prev]);
      setPage(0);
    } catch (err) {
      console.error(err);
      alert("Error al crear.");
    }
  }

  async function handleEliminar(id) {
    try {
      await deletePedidoBotella(id);
      setPedidos((prev) => prev.filter((p) => p.id !== id));
      setConfirmarBorrar(null);
    } catch (err) {
      console.error(err);
      alert("Error al borrar.");
    }
  }

  const formatMoney = (n) =>
    n == null ? "" : "$" + Number(n).toLocaleString("es-MX", { maximumFractionDigits: 0 });

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
          <h1 className="text-base sm:text-lg font-bold">Pedidos de botellas</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historial.length === 0}
              className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-md text-sm"
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 size={14} />
              <span className="hidden sm:inline">Deshacer ({historial.length})</span>
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
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Buscar perfume u orden..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#A47E3B] focus:outline-none"
              />
            </div>
            <select value={filtroProveedor} onChange={(e) => setFiltroProveedor(e.target.value)} className="border border-gray-300 rounded py-1.5 px-2 text-xs">
              <option value="">Todos los proveedores</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <select value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} className="border border-gray-300 rounded py-1.5 px-2 text-xs">
              <option value="">Todos los clientes</option>
              <option value="__sin__">Sin cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="border border-gray-300 rounded py-1.5 px-2 text-xs">
              <option value="">Todos los estados</option>
              <option value="avisado_no">Sin avisar al proveedor</option>
              <option value="recibido_no">Pendiente recibir</option>
              <option value="recibido_si">Recibidas</option>
              <option value="entregado_si">Entregadas al cliente</option>
              <option value="entregado_no">No entregadas al cliente</option>
              <option value="sin_cliente">Sin cliente asignado</option>
            </select>
            <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)} className="border border-gray-300 rounded py-1.5 px-2 text-xs">
              <option value="">Todos los años</option>
              {aniosDisponibles.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-3 flex flex-wrap gap-4 text-xs">
          <div><span className="text-gray-500">Botellas:</span> <strong className="text-gray-900">{stats.total}</strong></div>
          <div><span className="text-gray-500">Sin cliente:</span> <strong className="text-orange-600">{stats.sinCliente}</strong></div>
          <div><span className="text-gray-500">Vendido:</span> <strong className="text-gray-900">{formatMoney(stats.totalSell)}</strong></div>
          <div><span className="text-gray-500">Invertido:</span> <strong className="text-gray-900">{formatMoney(stats.totalBuy)}</strong></div>
          <div><span className="text-gray-500">Revenue:</span> <strong className="text-green-700">{formatMoney(stats.totalRevenue)}</strong></div>
        </div>

        {/* Barra de acciones masivas */}
        {seleccionadas.size > 0 && (
          <div className="bg-[#A47E3B] text-white rounded-xl shadow-md p-3 mb-3 flex flex-wrap items-center gap-2 sticky top-[60px] z-20">
            <span className="font-semibold text-sm mr-2">
              {seleccionadas.size}{" "}
              {seleccionadas.size === 1 ? "botella" : "botellas"} seleccionada
              {seleccionadas.size === 1 ? "" : "s"}
            </span>
            <button
              onClick={() => handleBulkUpdate("avisado_proveedor", true)}
              className="bg-white text-[#A47E3B] px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-100"
            >
              ✓ Avisado
            </button>
            <button
              onClick={() => handleBulkUpdate("recibido_por_mi", true)}
              className="bg-white text-[#A47E3B] px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-100"
            >
              ✓ Recibido
            </button>
            <button
              onClick={() => handleBulkUpdate("entregado_a_cliente", true)}
              className="bg-white text-[#A47E3B] px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-100"
            >
              ✓ Entregado
            </button>
            <button
              onClick={() => setBulkClienteModal(true)}
              className="bg-white text-[#A47E3B] px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-100"
            >
              Asignar cliente
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-700 flex items-center gap-1"
            >
              <Trash2 size={12} />
              Borrar
            </button>
            <button
              onClick={() => setSeleccionadas(new Set())}
              className="ml-auto text-white hover:text-gray-200 flex items-center gap-1 text-xs"
              title="Limpiar selección"
            >
              <X size={14} />
              Cancelar
            </button>
          </div>
        )}

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
                    <th className="px-2 py-2 w-8">
                      <input
                        ref={allSelectedRef}
                        type="checkbox"
                        checked={
                          paginados.length > 0 &&
                          paginados.every((p) => seleccionadas.has(p.id))
                        }
                        onChange={(e) => toggleSeleccionarTodosVisibles(e.target.checked)}
                        className="rounded"
                        title="Seleccionar todos los visibles"
                      />
                    </th>
                    <th className="px-2 py-2 font-semibold text-gray-700">Fecha</th>
                    <th className="px-2 py-2 font-semibold text-gray-700">Proveedor</th>
                    <th className="px-2 py-2 font-semibold text-gray-700">Orden</th>
                    <th className="px-2 py-2 font-semibold text-gray-700">Perfume</th>
                    <th className="px-2 py-2 font-semibold text-gray-700">Avisado</th>
                    <th className="px-2 py-2 font-semibold text-gray-700">Recibido</th>
                    <th className="px-2 py-2 font-semibold text-gray-700">Entregado</th>
                    <th className="px-2 py-2 font-semibold text-gray-700">Cliente</th>
                    <th className="px-2 py-2 font-semibold text-gray-700">USD</th>
                    <th className="px-2 py-2 font-semibold text-gray-700">MXN</th>
                    <th className="px-2 py-2 font-semibold text-gray-700">Importación</th>
                    <th className="px-2 py-2 font-semibold text-gray-700 bg-gray-200">Total</th>
                    <th className="px-2 py-2 font-semibold text-gray-700">Venta</th>
                    <th className="px-2 py-2 font-semibold text-gray-700 bg-gray-200">Revenue</th>
                    <th className="px-2 py-2 font-semibold text-gray-700 bg-gray-200">Margen %</th>
                    <th className="px-2 py-2 font-semibold text-gray-700 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((p) => (
                    <FilaPedido
                      key={p.id}
                      pedido={p}
                      proveedores={proveedores}
                      clientes={clientes}
                      parfums={parfums}
                      historicoNombres={historicoNombres}
                      isSaving={!!saving[p.id]}
                      ordenAlternada={ordenColorMap[p.id]}
                      seleccionada={seleccionadas.has(p.id)}
                      onToggleSeleccion={() => toggleSeleccion(p.id)}
                      onEdit={handleEdit}
                      onPerfumeChange={handlePerfumeChange}
                      onCreateCliente={handleCreateCliente}
                      onCheckboxMouseDown={handleCheckboxMouseDown}
                      onCheckboxMouseEnter={handleCheckboxMouseEnter}
                      onDelete={() => setConfirmarBorrar(p.id)}
                      confirmarBorrar={confirmarBorrar === p.id}
                      onConfirmDelete={() => handleEliminar(p.id)}
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
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50">← Anterior</button>
            <span className="text-gray-700">Página {page + 1} de {totalPaginas}</span>
            <button onClick={() => setPage(Math.min(totalPaginas - 1, page + 1))} disabled={page >= totalPaginas - 1} className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50">Siguiente →</button>
          </div>
        )}
      </main>

      {bulkClienteModal && (
        <BulkClienteModal
          clientes={clientes}
          count={seleccionadas.size}
          onAsignar={async (id) => {
            await handleBulkUpdate("cliente_id", id);
            setBulkClienteModal(false);
          }}
          onCancelar={() => setBulkClienteModal(false)}
          onCreateNew={handleCreateCliente}
        />
      )}
    </div>
  );
}

function FilaPedido({
  pedido, proveedores, clientes, parfums, historicoNombres,
  isSaving, ordenAlternada,
  seleccionada, onToggleSeleccion,
  onEdit, onPerfumeChange, onCreateCliente,
  onCheckboxMouseDown, onCheckboxMouseEnter,
  onDelete, confirmarBorrar, onConfirmDelete, onCancelDelete,
}) {
  // Prioridad: verde (entregado) > zebra por orden
  const rowClass = pedido.entregado_a_cliente
    ? "bg-green-100"
    : ordenAlternada
      ? "bg-amber-50"
      : "bg-white";

  const fmtNum = (n) => (n == null ? "" : Number(n).toLocaleString("es-MX", { maximumFractionDigits: 0 }));
  const fmtMoney = (n) => (n == null ? "" : "$" + Number(n).toLocaleString("es-MX", { maximumFractionDigits: 0 }));
  const cellInput = "w-full px-1 py-0.5 border border-transparent hover:border-gray-300 focus:border-[#A47E3B] rounded text-xs text-center bg-transparent";

  return (
    <tr className={`border-b border-gray-200 hover:bg-blue-50/40 ${rowClass} ${seleccionada ? "ring-2 ring-inset ring-[#A47E3B]" : ""}`}>
      <td className="px-2 py-1 w-8">
        <input
          type="checkbox"
          checked={seleccionada}
          onChange={onToggleSeleccion}
          className="rounded"
        />
      </td>
      <td className="px-1 py-1">
        <input type="date" defaultValue={pedido.fecha || ""} onBlur={(e) => { if (e.target.value !== (pedido.fecha || "")) onEdit(pedido.id, "fecha", e.target.value || null); }} className={`${cellInput} w-32`} />
      </td>
      <td className="px-1 py-1">
        <select value={pedido.proveedor_id || ""} onChange={(e) => onEdit(pedido.id, "proveedor_id", e.target.value ? Number(e.target.value) : null)} className={`${cellInput} w-32`}>
          <option value="">—</option>
          {proveedores.map((pr) => <option key={pr.id} value={pr.id}>{pr.nombre}</option>)}
        </select>
      </td>
      <td className="px-1 py-1">
        <input type="text" defaultValue={pedido.numero_orden || ""} onBlur={(e) => { if (e.target.value !== (pedido.numero_orden || "")) onEdit(pedido.id, "numero_orden", e.target.value || null); }} className={`${cellInput} w-28`} />
      </td>
      <td className="px-1 py-1">
        <PerfumeCombobox
          nombre={pedido.perfume_nombre}
          parfumId={pedido.parfum_id}
          parfums={parfums}
          historicoNombres={historicoNombres}
          onChange={(nombre, parfumIdNuevo) => onPerfumeChange(pedido.id, nombre, parfumIdNuevo)}
        />
      </td>
      <td
        className="px-1 py-1 select-none"
        onMouseDown={(e) => { e.preventDefault(); onCheckboxMouseDown(pedido.id, "avisado_proveedor", !!pedido.avisado_proveedor); }}
        onMouseEnter={() => onCheckboxMouseEnter(pedido.id, "avisado_proveedor", !!pedido.avisado_proveedor)}
      >
        <input type="checkbox" checked={!!pedido.avisado_proveedor} readOnly className="rounded cursor-pointer pointer-events-none" />
      </td>
      <td
        className="px-1 py-1 select-none"
        onMouseDown={(e) => { e.preventDefault(); onCheckboxMouseDown(pedido.id, "recibido_por_mi", !!pedido.recibido_por_mi); }}
        onMouseEnter={() => onCheckboxMouseEnter(pedido.id, "recibido_por_mi", !!pedido.recibido_por_mi)}
      >
        <input type="checkbox" checked={!!pedido.recibido_por_mi} readOnly className="rounded cursor-pointer pointer-events-none" />
      </td>
      <td
        className={`px-1 py-1 select-none ${!pedido.cliente_id ? "opacity-40" : ""}`}
        onMouseDown={(e) => {
          if (!pedido.cliente_id) return;
          e.preventDefault();
          onCheckboxMouseDown(pedido.id, "entregado_a_cliente", !!pedido.entregado_a_cliente);
        }}
        onMouseEnter={() => onCheckboxMouseEnter(pedido.id, "entregado_a_cliente", !!pedido.entregado_a_cliente)}
        title={!pedido.cliente_id ? "Asigna un cliente primero" : ""}
      >
        <input type="checkbox" checked={!!pedido.entregado_a_cliente} readOnly disabled={!pedido.cliente_id} className="rounded cursor-pointer pointer-events-none" />
      </td>
      <td className="px-1 py-1">
        <ClienteCombobox value={pedido.cliente_id} clientes={clientes} onChange={(id) => onEdit(pedido.id, "cliente_id", id)} onCreateNew={onCreateCliente} />
      </td>
      <td className="px-1 py-1">
        <MoneyInput value={pedido.buy_usd_discount} width="w-20" onBlur={(v) => { if (v !== pedido.buy_usd_discount) onEdit(pedido.id, "buy_usd_discount", v); }} cellInput={cellInput} />
      </td>
      <td className="px-1 py-1">
        <MoneyInput value={pedido.buy_mxn} width="w-24" onBlur={(v) => { if (v !== pedido.buy_mxn) onEdit(pedido.id, "buy_mxn", v); }} cellInput={cellInput} />
      </td>
      <td className="px-1 py-1">
        <MoneyInput value={pedido.importing} width="w-20" onBlur={(v) => { if (v !== pedido.importing) onEdit(pedido.id, "importing", v); }} cellInput={cellInput} />
      </td>
      <td className="px-1 py-1 text-gray-700 font-semibold whitespace-nowrap">{fmtMoney(pedido.buy_total)}</td>
      <td className="px-1 py-1">
        <MoneyInput value={pedido.sell} width="w-24" onBlur={(v) => { if (v !== pedido.sell) onEdit(pedido.id, "sell", v); }} cellInput={cellInput} />
      </td>
      <td className="px-1 py-1 text-gray-700 font-semibold whitespace-nowrap">{fmtMoney(pedido.revenue)}</td>
      <td className="px-1 py-1 text-gray-600 font-semibold whitespace-nowrap">
        {pedido.margin_pct != null ? `${Number(pedido.margin_pct).toFixed(1)}%` : ""}
      </td>
      <td className="px-1 py-1 w-10">
        {isSaving ? (
          <Loader2 className="animate-spin text-gray-400 mx-auto" size={12} />
        ) : confirmarBorrar ? (
          <div className="flex gap-0.5 justify-center">
            <button onClick={onConfirmDelete} className="text-red-600 hover:text-red-800 text-xs font-bold px-1" title="Confirmar">✓</button>
            <button onClick={onCancelDelete} className="text-gray-500 hover:text-gray-700 text-xs px-1" title="Cancelar">✕</button>
          </div>
        ) : (
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600 transition-colors" title="Borrar">
            <Trash2 size={12} />
          </button>
        )}
      </td>
    </tr>
  );
}
function MoneyInput({ value, onBlur, width, cellInput }) {
  return (
    <div className="relative inline-block">
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">$</span>
      <input
        type="number"
        step="0.01"
        defaultValue={value ?? ""}
        onBlur={(e) => {
          const v = e.target.value === "" ? null : Number(e.target.value);
          onBlur(v);
        }}
        className={`${cellInput} ${width} pl-4 no-spinner`}
      />
    </div>
  );
}
function BulkClienteModal({ clientes, count, onAsignar, onCancelar, onCreateNew }) {
  const [texto, setTexto] = useState("");
  const [creando, setCreando] = useState(false);

  const filtrados = texto.trim()
    ? clientes.filter((c) =>
        c.nombre.toLowerCase().includes(texto.toLowerCase().trim()),
      )
    : clientes;

  const matchExacto = clientes.some(
    (c) => c.nombre.toLowerCase() === texto.toLowerCase().trim(),
  );

  async function handleCreate() {
    if (!texto.trim()) return;
    setCreando(true);
    try {
      const nuevo = await onCreateNew(texto.trim());
      await onAsignar(nuevo.id);
    } catch {
      alert("Error al crear cliente.");
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Asignar cliente a {count} {count === 1 ? "botella" : "botellas"}
          </h2>
          <button onClick={onCancelar} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar o escribir cliente nuevo..."
          autoFocus
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2 focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
        />
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded">
          <button
            onClick={() => onAsignar(null)}
            className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 text-sm border-b border-gray-200"
          >
            — Sin cliente (quitar asignación) —
          </button>
          {filtrados.slice(0, 100).map((c) => (
            <button
              key={c.id}
              onClick={() => onAsignar(c.id)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100"
            >
              {c.nombre}
              {c.es_propio && <span className="ml-1 text-amber-500">⭐</span>}
            </button>
          ))}
          {texto.trim() && !matchExacto && (
            <button
              onClick={handleCreate}
              disabled={creando}
              className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 text-green-800 text-sm font-semibold"
            >
              {creando ? "Creando..." : `+ Crear cliente: "${texto.trim()}"`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}