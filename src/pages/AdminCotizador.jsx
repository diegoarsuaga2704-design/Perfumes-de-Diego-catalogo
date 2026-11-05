import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Save,
  Search,
  Trash2,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { getTipoCambio, calcularCotizacion } from "../functions/cotizador";
import { formatPrecio } from "../functions/formatPrecio";
import {
  getCotizaciones,
  guardarCotizacion,
  borrarCotizacion,
} from "../functions/getCotizaciones";
import SelectorLista from "../ui/SelectorLista";
import { normalizarTexto } from "../functions/normalizarTexto";

// Ajustes que casi no cambian (impuestos, ganancia): se recuerdan en
// este navegador para no capturarlos cada vez.
const KEY_AJUSTES = "admin_cotizador_ajustes";
const AJUSTES_BASE = {
  modoGanancia: "pesos",
  ganancia: 800,
  gananciaPct: 20,
  iva: 16,
  isr: 2.5,
};
const leerAjustes = () => {
  try {
    return { ...AJUSTES_BASE, ...JSON.parse(localStorage.getItem(KEY_AJUSTES) || "{}") };
  } catch {
    return AJUSTES_BASE;
  }
};

const $ = (n, dec = 0) => `$${formatPrecio(n, dec)}`;

const TAMANOS = [30, 50, 70, 75, 100, 125, 150, 200];

// Tiempo de llegada: valor guardado → texto para el cliente.
const TIEMPOS = {
  inmediato: "Envío inmediato",
  "2 semanas": "2 semanas",
  "4 semanas": "4 semanas",
};

// Mensaje de WhatsApp para el cliente (mismo para la cotización actual y
// las guardadas).
function armarMensaje(nombre, ml, precio, tiempo, preguntar = true) {
  const limpio = (nombre || "").trim();
  return [
    "¡Hola! Te comparto la cotización:",
    "",
    `Perfume: ${limpio}`,
    ml ? `Tamaño: ${ml} ml` : null,
    `Precio: ${$(precio)} + envío`,
    TIEMPOS[tiempo] ? `Tiempo de entrega: ${TIEMPOS[tiempo]}` : null,
    ...(preguntar ? ["", "¿Quisieras pedirlo?"] : []),
  ]
    .filter((l) => l !== null)
    .join("\n");
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const t = document.createElement("textarea");
    t.value = texto;
    document.body.appendChild(t);
    t.select();
    document.execCommand("copy");
    t.remove();
  }
}

// Solo números (con un punto decimal opcional).
const soloNumero = (v) => {
  const limpio = String(v).replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [entero, ...resto] = limpio.split(".");
  return resto.length ? `${entero}.${resto.join("")}` : entero;
};

const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

function Campo({ label, children, ayuda }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1">{children}</div>
      {ayuda && <span className="text-xs text-gray-500">{ayuda}</span>}
    </label>
  );
}

const INPUT =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-base bg-white focus:ring-2 focus:ring-[#A47E3B] focus:outline-none";
const CARD = "bg-white rounded-xl border border-gray-200 p-4 sm:p-5";

export default function AdminCotizador() {
  const navigate = useNavigate();
  // Abrir siempre desde arriba (el panel de admin deja la página bajada).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [nombre, setNombre] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [casa, setCasa] = useState("");
  // Listas de proveedores y casas (se administran en el formulario).
  const [listaProveedores, setListaProveedores] = useState([]);
  const [listaCasas, setListaCasas] = useState([]);
  const [tiempo, setTiempo] = useState("");
  const [ml, setMl] = useState("");
  const [costoUsd, setCostoUsd] = useState("");
  const [tc, setTc] = useState("");
  const [tcInfo, setTcInfo] = useState(null);
  const [cargandoTc, setCargandoTc] = useState(false);
  const [ajustes, setAjustes] = useState(leerAjustes);
  const [copiado, setCopiado] = useState(false);

  const cargarTc = async () => {
    setCargandoTc(true);
    const r = await getTipoCambio();
    setCargandoTc(false);
    if (r) {
      setTc(r.valor.toFixed(4));
      setTcInfo(r);
    } else {
      setTcInfo({ error: true });
    }
  };
  useEffect(() => {
    cargarTc();
  }, []);

  const cambiarAjuste = (campo, valor) => {
    setAjustes((prev) => {
      const nuevo = { ...prev, [campo]: valor };
      try {
        localStorage.setItem(KEY_AJUSTES, JSON.stringify(nuevo));
      } catch {
        // sin localStorage
      }
      return nuevo;
    });
  };

  const r = useMemo(
    // El envío no se suma: el mensaje dice "+ envío".
    () => calcularCotizacion({ costoUsd, tipoCambio: tc, ...ajustes, envio: 0 }),
    [costoUsd, tc, ajustes],
  );
  const listo = Number(costoUsd) > 0 && Number(tc) > 0 && nombre.trim();

  const mensaje = useMemo(
    () => armarMensaje(nombre, ml, r.precio, tiempo, ajustes.preguntar !== false),
    [nombre, ml, r, tiempo, ajustes.preguntar],
  );

  const copiar = async () => {
    await copiarTexto(mensaje);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // ---- Cotizaciones guardadas ----
  const [guardadas, setGuardadas] = useState([]);
  const [errorLista, setErrorLista] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [msgGuardar, setMsgGuardar] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroMl, setFiltroMl] = useState("");
  const [filtroDias, setFiltroDias] = useState("");
  const [filtroCasa, setFiltroCasa] = useState("");
  const [orden, setOrden] = useState("recientes");
  const [copiadoId, setCopiadoId] = useState(null);
  const [verFiltros, setVerFiltros] = useState(false);
  const [abiertaId, setAbiertaId] = useState(null);
  // Ajustes abiertos en computadora; en celular plegados para ahorrar espacio.
  const [ajustesAbiertos, setAjustesAbiertos] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );

  const cargarGuardadas = () =>
    getCotizaciones()
      .then((d) => {
        setGuardadas(d);
        setErrorLista("");
      })
      .catch(() =>
        setErrorLista("No se pudieron cargar las cotizaciones. ¿Ya corriste el SQL de la tabla cotizaciones?"),
      );
  useEffect(() => {
    cargarGuardadas();
  }, []);

  const proveedores = useMemo(
    () =>
      [
        ...new Set([
          ...listaProveedores.map((p) => p.nombre),
          ...guardadas.map((c) => (c.proveedor || "").trim()).filter(Boolean),
        ]),
      ].sort((a, b) => a.localeCompare(b, "es")),
    [guardadas, listaProveedores],
  );
  const casas = useMemo(
    () =>
      [
        ...new Set([
          ...listaCasas.map((c) => c.nombre),
          ...guardadas.map((c) => (c.casa || "").trim()).filter(Boolean),
        ]),
      ].sort((a, b) => a.localeCompare(b, "es")),
    [guardadas, listaCasas],
  );
  const tamanosGuardados = useMemo(
    () => [...new Set(guardadas.map((c) => Number(c.ml)).filter(Boolean))].sort((a, b) => a - b),
    [guardadas],
  );

  const filtradas = useMemo(() => {
    const q = normalizarTexto(busqueda.trim());
    const desde = filtroDias ? Date.now() - Number(filtroDias) * 86400000 : null;
    const lista = guardadas.filter(
      (c) =>
        (!q ||
          normalizarTexto(c.perfume).includes(q) ||
          normalizarTexto(c.proveedor).includes(q) ||
          normalizarTexto(c.casa).includes(q)) &&
        (!filtroProveedor || (c.proveedor || "").trim() === filtroProveedor) &&
        (!filtroCasa || (c.casa || "").trim() === filtroCasa) &&
        (!filtroMl || Number(c.ml) === Number(filtroMl)) &&
        (!desde || new Date(c.created_at).getTime() >= desde),
    );
    if (orden === "costo") {
      return [...lista].sort((a, b) => (Number(a.costo_usd) || 0) - (Number(b.costo_usd) || 0));
    }
    return lista;
  }, [guardadas, busqueda, filtroProveedor, filtroCasa, filtroMl, filtroDias, orden]);

  // Mejor precio: la cotización con menor costo en dólares entre las del
  // mismo perfume y tamaño (solo si hay más de una para comparar).
  const mejoresIds = useMemo(() => {
    const grupos = {};
    for (const c of guardadas) {
      const k = `${normalizarTexto(c.perfume).replace(/[^a-z0-9]/g, "")}|${Number(c.ml) || 0}`;
      (grupos[k] ||= []).push(c);
    }
    const ids = new Set();
    for (const g of Object.values(grupos)) {
      if (g.length < 2) continue;
      const min = Math.min(...g.map((c) => Number(c.costo_usd) || Infinity));
      g.filter((c) => Number(c.costo_usd) === min).forEach((c) => ids.add(c.id));
    }
    return ids;
  }, [guardadas]);

  const guardar = async () => {
    setGuardando(true);
    setMsgGuardar("");
    try {
      const nueva = await guardarCotizacion({
        perfume: nombre.trim(),
        ml: Number(ml) || null,
        proveedor: proveedor.trim() || null,
        casa: casa.trim() || null,
        costo_usd: Number(costoUsd) || 0,
        tipo_cambio: Number(tc) || 0,
        costo_mxn: Math.round(r.costoMxn * 100) / 100,
        ganancia: Math.round(r.gananciaReal * 100) / 100,
        iva: Number(ajustes.iva) || 0,
        isr: Number(ajustes.isr) || 0,
        precio: r.precio,
        tiempo_entrega: tiempo || null,
      });
      setGuardadas((prev) => [nueva, ...prev]);
      setMsgGuardar(`Cotización de ${nueva.perfume} guardada.`);
      // Formulario limpio para la siguiente (tipo de cambio y ajustes se quedan).
      setNombre("");
      setCasa("");
      setProveedor("");
      setMl("");
      setCostoUsd("");
      setTiempo("");
    } catch {
      setMsgGuardar("No se pudo guardar. ¿Ya corriste el SQL de la tabla cotizaciones?");
    } finally {
      setGuardando(false);
    }
  };

  const usar = (c) => {
    setNombre(c.perfume || "");
    setMl(c.ml ? String(Number(c.ml)) : "");
    setProveedor(c.proveedor || "");
    setCasa(c.casa || "");
    setTiempo(c.tiempo_entrega || "");
    setCostoUsd(String(Number(c.costo_usd) || ""));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copiarGuardada = async (c) => {
    await copiarTexto(
      armarMensaje(c.perfume, c.ml ? Number(c.ml) : "", c.precio, c.tiempo_entrega, ajustes.preguntar !== false),
    );
    setCopiadoId(c.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const borrar = async (c) => {
    if (!window.confirm(`¿Borrar la cotización de ${c.perfume}?`)) return;
    try {
      await borrarCotizacion(c.id);
      setGuardadas((prev) => prev.filter((x) => x.id !== c.id));
    } catch {
      setErrorLista("No se pudo borrar.");
    }
  };

  const filtrosActivos = [filtroCasa, filtroProveedor, filtroMl, filtroDias].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-30 bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-2">
          <button onClick={() => navigate("/admin")} aria-label="Regresar" className="p-2 hover:bg-gray-700 rounded-md">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold flex-1">Cotizador</h1>
          <button
            type="button"
            onClick={() => document.getElementById("guardadas")?.scrollIntoView({ behavior: "smooth" })}
            className="text-sm border border-white/30 rounded-md px-3 py-1.5 hover:bg-white/10"
          >
            Guardadas ({guardadas.length})
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-4 pb-32 md:pb-8 grid gap-4 md:gap-5 md:grid-cols-2">
        <div className="space-y-4 md:space-y-5">
          {/* Perfume */}
          <section className={`${CARD} space-y-3`}>
            <Campo label="Nombre del perfume">
              <input className={INPUT} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Baccarat Rouge 540 Extrait" />
            </Campo>
            <SelectorLista
              tabla="casas_cotizador"
              etiqueta="Casa"
              articulo="una"
              value={casa}
              onChange={setCasa}
              onItems={setListaCasas}
            />
            <SelectorLista
              tabla="proveedores_cotizador"
              etiqueta="Proveedor"
              value={proveedor}
              onChange={setProveedor}
              onItems={setListaProveedores}
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Tamaño</span>
              {/* Tamaños comunes: un toque llena el campo de ml */}
              <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-4 gap-2 mt-1">
                {TAMANOS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMl(String(n))}
                    className={`py-2 rounded-md border text-sm font-medium ${
                      String(ml) === String(n)
                        ? "bg-[#A47E3B] border-[#A47E3B] text-white"
                        : "border-gray-300 text-gray-700 bg-white"
                    }`}
                  >
                    {n} ml
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Otro tamaño (ml)">
                <input className={INPUT} inputMode="decimal" value={ml} onChange={(e) => setMl(soloNumero(e.target.value))} placeholder="100" />
              </Campo>
              <Campo label="Te cuesta (USD)">
                <input className={INPUT} inputMode="decimal" value={costoUsd} onChange={(e) => setCostoUsd(soloNumero(e.target.value))} placeholder="250" />
              </Campo>
            </div>
            <p className="text-sm text-gray-700 -mt-1">
              En pesos: <span className="font-semibold">{$(r.costoMxn, 2)}</span>
            </p>
          </section>

          {/* Tipo de cambio, ganancia e impuestos (casi no cambian: plegado) */}
          <details className={`${CARD} group`} open={ajustesAbiertos} onToggle={(e) => setAjustesAbiertos(e.currentTarget.open)}>
            <summary className="cursor-pointer list-none flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">Tipo de cambio y ganancia</p>
                <p className="text-xs text-gray-500 truncate">
                  ${tc || "—"} · Ganancia{" "}
                  {ajustes.modoGanancia === "porcentaje" ? `${ajustes.gananciaPct}%` : $(ajustes.ganancia)} · IVA{" "}
                  {ajustes.iva}% · ISR {ajustes.isr}%
                </p>
              </div>
              <ChevronDown size={18} className="shrink-0 text-gray-500 transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Pesos por dólar</span>
                  <button
                    type="button"
                    onClick={cargarTc}
                    disabled={cargandoTc}
                    className="inline-flex items-center gap-1 text-sm text-[#A47E3B] disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={cargandoTc ? "animate-spin" : ""} /> Actualizar
                  </button>
                </div>
                <input className={`${INPUT} mt-1`} inputMode="decimal" value={tc} onChange={(e) => setTc(e.target.value)} />
                <span className="text-xs text-gray-500">
                  {tcInfo?.error
                    ? "No se pudo obtener el tipo de cambio. Escríbelo a mano."
                    : tcInfo
                      ? `Fuente: ${tcInfo.fuente}${tcInfo.fecha ? ` · ${tcInfo.fecha}` : ""}.`
                      : "Cargando…"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["pesos", "Ganancia en $"],
                  ["porcentaje", "Ganancia en %"],
                ].map(([v, t]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => cambiarAjuste("modoGanancia", v)}
                    className={`py-2 rounded-md border ${
                      ajustes.modoGanancia === v
                        ? "bg-[#A47E3B] border-[#A47E3B] text-white"
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {ajustes.modoGanancia === "pesos" ? (
                <Campo label="Tu ganancia (MXN)">
                  <input className={INPUT} inputMode="decimal" value={ajustes.ganancia} onChange={(e) => cambiarAjuste("ganancia", soloNumero(e.target.value))} />
                </Campo>
              ) : (
                <Campo label="Tu ganancia (% del costo)">
                  <div className="grid grid-cols-6 gap-1.5">
                    {[15, 20, 25, 30, 45, 50].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => cambiarAjuste("gananciaPct", String(n))}
                        className={`py-2 rounded-md border text-sm font-medium ${
                          String(ajustes.gananciaPct) === String(n)
                            ? "bg-[#A47E3B] border-[#A47E3B] text-white"
                            : "border-gray-300 text-gray-700"
                        }`}
                      >
                        {n}%
                      </button>
                    ))}
                  </div>
                  <input
                    className={`${INPUT} mt-2`}
                    inputMode="decimal"
                    value={ajustes.gananciaPct}
                    onChange={(e) => cambiarAjuste("gananciaPct", soloNumero(e.target.value))}
                    placeholder="Otro %"
                  />
                </Campo>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Campo label="IVA (%)">
                  <input className={INPUT} inputMode="decimal" value={ajustes.iva} onChange={(e) => cambiarAjuste("iva", soloNumero(e.target.value))} />
                </Campo>
                <Campo label="ISR (%)" ayuda="Sobre la venta sin IVA">
                  <input className={INPUT} inputMode="decimal" value={ajustes.isr} onChange={(e) => cambiarAjuste("isr", soloNumero(e.target.value))} />
                </Campo>
              </div>
              <p className="text-xs text-gray-500">Se guardan en este navegador.</p>
            </div>
          </details>
        </div>

        {/* Resultado */}
        <div className="space-y-4 md:space-y-5">
          <section className={`${CARD} space-y-2`}>
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold text-gray-900">Precio al cliente</h2>
              <span className="text-2xl font-bold text-gray-900">{$(r.precio)}</span>
            </div>
            <p className="text-xs text-gray-500 text-right -mt-1">+ envío</p>
            <details className="group">
              <summary className="cursor-pointer list-none text-sm text-[#A47E3B] inline-flex items-center gap-1">
                Ver desglose <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-1 mt-2">
                <Fila t="Costo en pesos" v={$(r.costoMxn, 2)} />
                <Fila t="Tu ganancia" v={$(r.gananciaMxn, 2)} />
                <Fila t="IVA que se traslada" v={$(r.ivaMxn, 2)} />
                <Fila t="ISR que se traslada" v={$(r.isrMxn, 2)} />
                <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 mt-2">
                  Después de pagar IVA e ISR te quedan {$(r.teQueda, 2)}: tu costo de{" "}
                  {$(r.costoMxn, 2)} más {$(r.gananciaReal, 2)} de ganancia
                  {r.gananciaReal - r.gananciaMxn > 0.5
                    ? " (terminar el precio en 90 te suma un poco)"
                    : r.gananciaMxn - r.gananciaReal > 0.5
                      ? " (terminar el precio en 90 te resta unos pesos)"
                      : ""}
                  .
                </div>
              </div>
            </details>
          </section>

          <section className={`${CARD} space-y-3`}>
            <h2 className="font-semibold text-gray-900">Mensaje para el cliente</h2>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Tiempo de llegada</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TIEMPOS).map(([v, t]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTiempo(tiempo === v ? "" : v)}
                    className={`py-2 px-1 rounded-md border text-sm font-medium ${
                      tiempo === v
                        ? "bg-[#A47E3B] border-[#A47E3B] text-white"
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={ajustes.preguntar !== false}
                onChange={(e) => cambiarAjuste("preguntar", e.target.checked)}
                className="h-5 w-5 accent-[#A47E3B]"
              />
              Terminar con “¿Quisieras pedirlo?”
            </label>
            <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-md p-3 font-sans">
              {listo ? mensaje : "Llena nombre, costo y tipo de cambio para armar el mensaje."}
            </pre>
            {/* En celular estos botones van en la barra fija de abajo */}
            <div className="hidden md:block space-y-3">
              <BotonesAccion
                listo={listo}
                copiado={copiado}
                guardando={guardando}
                onCopiar={copiar}
                onGuardar={guardar}
              />
            </div>
            {msgGuardar && <p className="text-sm text-gray-600">{msgGuardar}</p>}
          </section>
        </div>

        {/* Cotizaciones guardadas */}
        <section id="guardadas" className={`${CARD} md:col-span-2 space-y-3 scroll-mt-16`}>
          <h2 className="font-semibold text-gray-900">
            Cotizaciones guardadas{" "}
            <span className="font-normal text-gray-500">
              ({filtradas.length}
              {filtradas.length !== guardadas.length ? ` de ${guardadas.length}` : ""})
            </span>
          </h2>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={`${INPUT} pl-9`}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar perfume, casa o proveedor"
              />
            </div>
            <button
              type="button"
              onClick={() => setVerFiltros((v) => !v)}
              className={`shrink-0 inline-flex items-center gap-1 px-3 rounded-md border text-sm font-medium ${
                verFiltros || filtrosActivos
                  ? "border-[#A47E3B] text-[#A47E3B]"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              <SlidersHorizontal size={16} />
              Filtros{filtrosActivos ? ` (${filtrosActivos})` : ""}
            </button>
          </div>

          {verFiltros && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <select className={INPUT} value={filtroCasa} onChange={(e) => setFiltroCasa(e.target.value)}>
                <option value="">Todas las casas</option>
                {casas.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select className={INPUT} value={filtroProveedor} onChange={(e) => setFiltroProveedor(e.target.value)}>
                <option value="">Todos los proveedores</option>
                {proveedores.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select className={INPUT} value={filtroMl} onChange={(e) => setFiltroMl(e.target.value)}>
                <option value="">Todos los tamaños</option>
                {tamanosGuardados.map((n) => (
                  <option key={n} value={n}>{n} ml</option>
                ))}
              </select>
              <select className={INPUT} value={filtroDias} onChange={(e) => setFiltroDias(e.target.value)}>
                <option value="">Cualquier fecha</option>
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 3 meses</option>
              </select>
              <select className={INPUT} value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="recientes">Más recientes</option>
                <option value="costo">Menor costo</option>
              </select>
              {(busqueda || filtrosActivos > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda("");
                    setFiltroProveedor("");
                    setFiltroMl("");
                    setFiltroDias("");
                    setFiltroCasa("");
                  }}
                  className="text-sm text-gray-600 hover:text-red-600 underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {errorLista && <p className="text-sm text-red-600">{errorLista}</p>}

          {filtradas.length === 0 ? (
            <p className="text-sm text-gray-500">
              {guardadas.length ? "Ninguna cotización coincide con la búsqueda." : "Aún no hay cotizaciones guardadas."}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {filtradas.map((c) => {
                const abierta = abiertaId === c.id;
                return (
                  <li key={c.id}>
                    {/* Renglón plegado: perfume, ml y precio. Al tocarlo se despliega. */}
                    <button
                      type="button"
                      onClick={() => setAbiertaId(abierta ? null : c.id)}
                      aria-expanded={abierta}
                      className="w-full flex items-center gap-3 p-3 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {c.perfume}
                          {c.ml ? <span className="font-normal text-gray-500"> · {Number(c.ml)} ml</span> : null}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {[c.casa, c.proveedor].filter(Boolean).join(" · ") || fechaCorta(c.created_at)}
                          {mejoresIds.has(c.id) && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                              Mejor precio
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="font-bold text-gray-900 shrink-0">{$(c.precio)}</span>
                      <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${abierta ? "rotate-180" : ""}`} />
                    </button>
                    {abierta && (
                      <div className="px-3 pb-3 space-y-3">
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                          <dt className="text-gray-500">Fecha</dt>
                          <dd className="text-gray-800 text-right">{fechaCorta(c.created_at)}</dd>
                          <dt className="text-gray-500">Casa</dt>
                          <dd className="text-gray-800 text-right">{c.casa || "—"}</dd>
                          <dt className="text-gray-500">Proveedor</dt>
                          <dd className="text-gray-800 text-right">{c.proveedor || "—"}</dd>
                          <dt className="text-gray-500">Tiempo de entrega</dt>
                          <dd className="text-gray-800 text-right">{TIEMPOS[c.tiempo_entrega] || "—"}</dd>
                          <dt className="text-gray-500">Costo</dt>
                          <dd className="text-gray-800 text-right">
                            US${formatPrecio(c.costo_usd, 2)} × {Number(c.tipo_cambio).toFixed(2)}
                          </dd>
                          <dt className="text-gray-500">Costo en pesos</dt>
                          <dd className="text-gray-800 text-right">{$(c.costo_mxn, 2)}</dd>
                          <dt className="text-gray-500">Tu ganancia</dt>
                          <dd className="text-gray-800 text-right">{$(c.ganancia, 2)}</dd>
                        </dl>
                        <div className="grid grid-cols-3 gap-2">
                          <button type="button" onClick={() => usar(c)} className="py-2 rounded-md border border-[#A47E3B] text-[#A47E3B] text-sm font-semibold">
                            Usar
                          </button>
                          <button type="button" onClick={() => copiarGuardada(c)} className="py-2 rounded-md bg-[#A47E3B] text-white text-sm font-semibold">
                            {copiadoId === c.id ? "Copiado" : "Copiar"}
                          </button>
                          <button type="button" onClick={() => borrar(c)} className="py-2 rounded-md border border-gray-300 text-gray-600 text-sm font-semibold inline-flex items-center justify-center gap-1">
                            <Trash2 size={15} /> Borrar
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {/* Celular: precio y botones siempre a la mano */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] px-3 pt-2 pb-3">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-gray-600 truncate">{nombre.trim() || "Precio al cliente"}</span>
          <span className="text-xl font-bold text-gray-900">{$(r.precio)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <BotonesAccion
            listo={listo}
            copiado={copiado}
            guardando={guardando}
            onCopiar={copiar}
            onGuardar={guardar}
            compacto
          />
        </div>
      </div>
    </div>
  );
}

// Copiar mensaje y Guardar cotización (en el panel y en la barra del celular).
function BotonesAccion({ listo, copiado, guardando, onCopiar, onGuardar, compacto = false }) {
  const alto = compacto ? "py-2.5" : "py-3";
  return (
    <>
      <button
        type="button"
        onClick={onCopiar}
        disabled={!listo}
        className={`w-full inline-flex items-center justify-center gap-2 ${alto} rounded-md font-semibold text-white transition-colors ${
          copiado ? "bg-green-600" : "bg-[#A47E3B] hover:bg-[#8b6d32]"
        } disabled:bg-gray-300 disabled:text-gray-500`}
      >
        {copiado ? <Check size={18} /> : <Copy size={18} />}
        {copiado ? "Copiado" : compacto ? "Copiar" : "Copiar mensaje"}
      </button>
      <button
        type="button"
        onClick={onGuardar}
        disabled={!listo || guardando}
        className={`w-full inline-flex items-center justify-center gap-2 ${alto} rounded-md font-semibold border border-[#A47E3B] text-[#A47E3B] bg-white hover:bg-[#A47E3B]/10 disabled:opacity-50`}
      >
        <Save size={18} />
        {guardando ? "Guardando…" : compacto ? "Guardar" : "Guardar cotización"}
      </button>
    </>
  );
}

function Fila({ t, v, fuerte = false, grande = false }) {
  return (
    <div className={`flex justify-between ${fuerte ? "font-semibold text-gray-900" : "text-gray-700"} ${grande ? "text-lg" : "text-sm"}`}>
      <span>{t}</span>
      <span>{v}</span>
    </div>
  );
}
