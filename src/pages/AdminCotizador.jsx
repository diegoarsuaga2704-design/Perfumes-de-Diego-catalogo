import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, RefreshCw, Save, Search, Trash2 } from "lucide-react";
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
function armarMensaje(nombre, ml, precio, tiempo) {
  const limpio = (nombre || "").trim();
  return [
    "¡Hola! Te comparto la cotización:",
    "",
    `Perfume: ${limpio}`,
    ml ? `Tamaño: ${ml} ml` : null,
    `Precio: ${$(precio)} + envío`,
    TIEMPOS[tiempo] ? `Tiempo de entrega: ${TIEMPOS[tiempo]}` : null,
    "",
    `¿Te aparto ${limpio}${ml ? ` ${ml} ml` : ""}?`,
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
    () => armarMensaje(nombre, ml, r.precio, tiempo),
    [nombre, ml, r, tiempo],
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
      setMsgGuardar("Cotización guardada.");
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
    await copiarTexto(armarMensaje(c.perfume, c.ml ? Number(c.ml) : "", c.precio, c.tiempo_entrega));
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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="p-2 hover:bg-gray-700 rounded-md">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold">Cotizador de botellas</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-5">
          {/* Perfume */}
          <section className={`${CARD} space-y-3`}>
            <h2 className="font-semibold text-gray-900">Perfume</h2>
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
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Tamaño (ml)">
                <input className={INPUT} inputMode="decimal" value={ml} onChange={(e) => setMl(soloNumero(e.target.value))} placeholder="100" />
              </Campo>
              <Campo label="Te cuesta (USD)">
                <input className={INPUT} inputMode="decimal" value={costoUsd} onChange={(e) => setCostoUsd(soloNumero(e.target.value))} placeholder="250" />
                <p className="mt-1 text-sm text-gray-700">
                  En pesos: <span className="font-semibold">{$(r.costoMxn, 2)}</span>
                </p>
              </Campo>
            </div>
            {/* Tamaños comunes: un toque llena el campo de ml */}
            <div className="flex flex-wrap gap-2">
              {TAMANOS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMl(String(n))}
                  className={`px-3 py-1.5 rounded-md border text-sm font-medium ${
                    String(ml) === String(n)
                      ? "bg-[#A47E3B] border-[#A47E3B] text-white"
                      : "border-gray-300 text-gray-700 hover:border-[#A47E3B]"
                  }`}
                >
                  {n} ml
                </button>
              ))}
            </div>
          </section>

          {/* Tipo de cambio */}
          <section className={`${CARD} space-y-2`}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Tipo de cambio</h2>
              <button
                type="button"
                onClick={cargarTc}
                disabled={cargandoTc}
                className="inline-flex items-center gap-1 text-sm text-[#A47E3B] hover:underline disabled:opacity-50"
              >
                <RefreshCw size={14} className={cargandoTc ? "animate-spin" : ""} /> Actualizar
              </button>
            </div>
            <Campo
              label="Pesos por dólar"
              ayuda={
                tcInfo?.error
                  ? "No se pudo obtener el tipo de cambio. Escríbelo a mano."
                  : tcInfo
                    ? `Fuente: ${tcInfo.fuente}${tcInfo.fecha ? ` · ${tcInfo.fecha}` : ""}. Puedes cambiarlo a mano.`
                    : "Cargando…"
              }
            >
              <input className={INPUT} inputMode="decimal" value={tc} onChange={(e) => setTc(e.target.value)} />
            </Campo>
          </section>

          {/* Ajustes */}
          <section className={`${CARD} space-y-3`}>
            <h2 className="font-semibold text-gray-900">Ganancia e impuestos</h2>
            <p className="text-xs text-gray-500">Se guardan en este navegador.</p>
            <div className="flex gap-2 text-sm">
              {[
                ["pesos", "Ganancia en $"],
                ["porcentaje", "Ganancia en %"],
              ].map(([v, t]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => cambiarAjuste("modoGanancia", v)}
                  className={`px-3 py-1.5 rounded-md border ${
                    ajustes.modoGanancia === v
                      ? "bg-[#A47E3B] border-[#A47E3B] text-white"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ajustes.modoGanancia === "pesos" ? (
                <Campo label="Tu ganancia (MXN)">
                  <input className={INPUT} inputMode="decimal" value={ajustes.ganancia} onChange={(e) => cambiarAjuste("ganancia", e.target.value)} />
                </Campo>
              ) : (
                <Campo label="Tu ganancia (% del costo)">
                  <input className={INPUT} inputMode="decimal" value={ajustes.gananciaPct} onChange={(e) => cambiarAjuste("gananciaPct", e.target.value)} />
                </Campo>
              )}
              <Campo label="IVA (%)">
                <input className={INPUT} inputMode="decimal" value={ajustes.iva} onChange={(e) => cambiarAjuste("iva", e.target.value)} />
              </Campo>
              <Campo label="ISR (%)" ayuda="Sobre la venta sin IVA">
                <input className={INPUT} inputMode="decimal" value={ajustes.isr} onChange={(e) => cambiarAjuste("isr", e.target.value)} />
              </Campo>
            </div>
          </section>
        </div>

        {/* Resultado */}
        <div className="space-y-5">
          <section className={`${CARD} space-y-2`}>
            <h2 className="font-semibold text-gray-900 mb-1">Cotización</h2>
            <Fila t="Costo en pesos" v={$(r.costoMxn, 2)} />
            <Fila t="Tu ganancia" v={$(r.gananciaMxn, 2)} />
            <Fila t="IVA que se traslada" v={$(r.ivaMxn, 2)} />
            <Fila t="ISR que se traslada" v={$(r.isrMxn, 2)} />
            <div className="border-t pt-2 mt-2">
              <Fila t="Precio al cliente (+ envío)" v={$(r.precio)} fuerte grande />
            </div>
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
          </section>

          <section className={`${CARD} space-y-3`}>
            <h2 className="font-semibold text-gray-900">Mensaje para el cliente</h2>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Tiempo de llegada</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TIEMPOS).map(([v, t]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTiempo(tiempo === v ? "" : v)}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium ${
                      tiempo === v
                        ? "bg-[#A47E3B] border-[#A47E3B] text-white"
                        : "border-gray-300 text-gray-700 hover:border-[#A47E3B]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-md p-3 font-sans">
              {listo ? mensaje : "Llena nombre, costo y tipo de cambio para armar el mensaje."}
            </pre>
            <button
              type="button"
              onClick={copiar}
              disabled={!listo}
              className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-white transition-colors ${
                copiado ? "bg-green-600" : "bg-[#A47E3B] hover:bg-[#8b6d32]"
              } disabled:bg-gray-300 disabled:text-gray-500`}
            >
              {copiado ? <Check size={18} /> : <Copy size={18} />}
              {copiado ? "Copiado" : "Copiar mensaje"}
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={!listo || guardando}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-md font-semibold border border-[#A47E3B] text-[#A47E3B] hover:bg-[#A47E3B]/10 disabled:opacity-50"
            >
              <Save size={18} />
              {guardando ? "Guardando…" : "Guardar cotización"}
            </button>
            {msgGuardar && <p className="text-sm text-gray-600">{msgGuardar}</p>}
          </section>
        </div>

        {/* Cotizaciones guardadas */}
        <section className={`${CARD} md:col-span-2 space-y-4`}>
          <h2 className="font-semibold text-gray-900">
            Cotizaciones guardadas{" "}
            <span className="font-normal text-gray-500">
              ({filtradas.length}
              {filtradas.length !== guardadas.length ? ` de ${guardadas.length}` : ""})
            </span>
          </h2>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="relative sm:col-span-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={`${INPUT} pl-9`}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por perfume, casa o proveedor"
              />
            </div>
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
              <option value="recientes">Más recientes primero</option>
              <option value="costo">Menor costo primero</option>
            </select>
            {(busqueda || filtroProveedor || filtroCasa || filtroMl || filtroDias) && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setFiltroProveedor("");
                  setFiltroMl("");
                  setFiltroDias("");
                  setFiltroCasa("");
                }}
                className="text-sm text-gray-600 hover:text-red-600 underline justify-self-start"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {errorLista && <p className="text-sm text-red-600">{errorLista}</p>}

          {filtradas.length === 0 ? (
            <p className="text-sm text-gray-500">
              {guardadas.length ? "Ninguna cotización coincide con la búsqueda." : "Aún no hay cotizaciones guardadas."}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {filtradas.map((c) => (
                <li key={c.id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {c.perfume}
                      {c.ml ? <span className="font-normal text-gray-500"> · {Number(c.ml)} ml</span> : null}
                      {mejoresIds.has(c.id) && (
                        <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          Mejor precio
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fechaCorta(c.created_at)}
                      {c.casa ? ` · ${c.casa}` : ""}
                      {c.proveedor ? ` · ${c.proveedor}` : ""}
                      {TIEMPOS[c.tiempo_entrega] ? ` · ${TIEMPOS[c.tiempo_entrega]}` : ""} · US${formatPrecio(c.costo_usd, 2)} × {Number(c.tipo_cambio).toFixed(2)} = {$(c.costo_mxn, 2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-gray-900">{$(c.precio)}</span>
                    <button type="button" onClick={() => usar(c)} className="text-sm text-[#A47E3B] hover:underline">
                      Usar
                    </button>
                    <button type="button" onClick={() => copiarGuardada(c)} className="text-sm text-[#A47E3B] hover:underline">
                      {copiadoId === c.id ? "Copiado" : "Copiar"}
                    </button>
                    <button type="button" onClick={() => borrar(c)} aria-label="Borrar" className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
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
