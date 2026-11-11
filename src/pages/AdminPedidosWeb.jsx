import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Search } from "lucide-react";
import { formatPrecio } from "../functions/formatPrecio";
import { normalizarTexto } from "../functions/normalizarTexto";
import {
  getPedidosWeb,
  cambiarEstadoPedidoWeb,
  ESTADOS_PEDIDO,
} from "../functions/pedidosWeb";

const $ = (n) => `$${formatPrecio(n)}`;
const fechaHora = (iso) =>
  new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
const ESTADO_PAGO = {
  approved: "aprobado",
  pending: "pendiente",
  in_process: "en revisión",
  rejected: "rechazado",
  cancelled: "cancelado",
  refunded: "devuelto",
};
// Número a formato de wa.me (52 + 10 dígitos).
const whatsappMx = (tel) => {
  const d = String(tel || "").replace(/\D/g, "");
  return d.length === 10 ? `52${d}` : d;
};
const lineaTexto = (it) =>
  it.tipoVenta === "botella"
    ? `${it.nombre}${it.mlBotella ? ` ${it.mlBotella} ml` : ""} × ${it.cantidad}`
    : `${it.mililitros} ml de ${it.nombre}`;

// Pedidos que llegaron por la tienda, incluidos los que se quedaron en el
// checkout sin enviarse por WhatsApp.
export default function AdminPedidosWeb() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("enviados");
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    getPedidosWeb()
      .then(setPedidos)
      .catch(() => setError("No se pudieron cargar los pedidos. ¿Ya corriste el SQL de pedidos_web?"))
      .finally(() => setCargando(false));
  }, []);

  const conteo = useMemo(() => {
    const c = {};
    for (const p of pedidos) c[p.estado] = (c[p.estado] || 0) + 1;
    return c;
  }, [pedidos]);

  const FILTROS = [
    ["enviados", "Enviados", (p) => p.estado !== "en_checkout"],
    ["en_checkout", "No enviados", (p) => p.estado === "en_checkout"],
    ["todos", "Todos", () => true],
  ];

  const visibles = useMemo(() => {
    const f = FILTROS.find(([k]) => k === filtro)?.[2] || (() => true);
    const q = normalizarTexto(busqueda.trim());
    return pedidos.filter(
      (p) =>
        f(p) &&
        (!q ||
          normalizarTexto(p.numero).includes(q) ||
          normalizarTexto(p.codigo_postal).includes(q) ||
          normalizarTexto(p.cliente?.nombre).includes(q) ||
          String(p.cliente?.telefono || "").includes(q) ||
          (p.items || []).some((it) => normalizarTexto(it.nombre).includes(q))),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidos, filtro, busqueda]);

  const cambiarEstado = async (p, estado) => {
    const previo = p.estado;
    setPedidos((prev) => prev.map((x) => (x.numero === p.numero ? { ...x, estado } : x)));
    try {
      await cambiarEstadoPedidoWeb(p.numero, estado);
    } catch {
      setError("No se pudo cambiar el estado.");
      setPedidos((prev) => prev.map((x) => (x.numero === p.numero ? { ...x, estado: previo } : x)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-30 bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-2">
          <button onClick={() => navigate("/admin")} aria-label="Regresar" className="p-2 hover:bg-gray-700 rounded-md">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold">Pedidos de la tienda</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {FILTROS.map(([k, t, f]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFiltro(k)}
              className={`py-2 rounded-md border text-sm font-semibold ${
                filtro === k ? "bg-[#A47E3B] border-[#A47E3B] text-white" : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              {t} ({pedidos.filter(f).length})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por número, perfume, cliente o código postal"
            className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-base bg-white focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
          />
        </div>

        {!cargando && pedidos.length > 0 && (
          <p className="text-xs text-gray-500">
            {Object.entries(ESTADOS_PEDIDO)
              .filter(([k]) => conteo[k])
              .map(([k, v]) => `${v.texto}: ${conteo[k]}`)
              .join(" · ")}
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {cargando && <p className="text-sm text-gray-500">Cargando…</p>}
        {!cargando && visibles.length === 0 && !error && (
          <p className="text-sm text-gray-500 bg-white rounded-lg border border-gray-200 p-4">No hay pedidos aquí.</p>
        )}

        <ul className="space-y-2">
          {visibles.map((p) => {
            const info = ESTADOS_PEDIDO[p.estado] || { texto: p.estado, color: "bg-gray-100 text-gray-700" };
            const esAbierto = abierto === p.numero;
            return (
              <li key={p.numero} className="bg-white rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setAbierto(esAbierto ? null : p.numero)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      #{p.numero}{" "}
                      <span className={`ml-1 text-[11px] font-semibold px-1.5 py-0.5 rounded ${info.color}`}>
                        {info.texto}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {fechaHora(p.created_at)} · {(p.items || []).length} producto
                      {(p.items || []).length === 1 ? "" : "s"}
                      {p.codigo_postal ? ` · CP ${p.codigo_postal}` : ""}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900 shrink-0">{$(p.total)}</span>
                  <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${esAbierto ? "rotate-180" : ""}`} />
                </button>
                {esAbierto && (
                  <div className="px-3 pb-3 space-y-3 text-sm">
                    <ul className="divide-y divide-gray-100">
                      {(p.items || []).map((it, i) => (
                        <li key={i} className="py-1.5 flex justify-between gap-3">
                          <span>
                            {lineaTexto(it)}
                            {it.casa ? <span className="text-gray-500"> · {it.casa}</span> : null}
                          </span>
                          <span className="whitespace-nowrap">{$(it.subtotal)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-0.5 text-gray-700">
                      <div className="flex justify-between"><span>Productos</span><span>{$(p.subtotal)}</span></div>
                      {Number(p.descuento) > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>Descuento {p.codigo_descuento ? `(${p.codigo_descuento})` : ""}</span>
                          <span>−{$(p.descuento)}</span>
                        </div>
                      )}
                      <div className="flex justify-between"><span>Envío</span><span>{Number(p.envio) > 0 ? $(p.envio) : "Gratis"}</span></div>
                      <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>{$(p.total)}</span></div>
                    </div>
                    {p.cliente && (
                      <div className="rounded-md bg-gray-50 border border-gray-200 p-2.5 space-y-0.5 text-gray-700">
                        <p className="font-semibold text-gray-900">{p.cliente.nombre}</p>
                        <p>
                          {p.cliente.calle}, {p.cliente.colonia}, CP {p.cliente.cp}
                        </p>
                        <p>
                          {p.cliente.ciudad}, {p.cliente.estado}
                        </p>
                        {p.cliente.referencias && <p className="text-gray-500">Ref: {p.cliente.referencias}</p>}
                        <p className="text-gray-500">{p.cliente.email}</p>
                        {p.cliente.telefono && (
                          <a
                            href={`https://wa.me/${whatsappMx(p.cliente.telefono)}?text=${encodeURIComponent(
                              `Hola ${p.cliente.nombre.split(" ")[0]}, soy Diego de Perfumes de Diego. Te escribo por tu pedido #${p.numero}.`,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-1.5 px-3 py-1.5 rounded-md bg-green-600 text-white font-semibold"
                          >
                            Escribirle · {p.cliente.telefono}
                          </a>
                        )}
                      </div>
                    )}
                    {p.pago && (
                      <p className="text-xs text-gray-500">
                        Mercado Pago #{p.pago.id} · {ESTADO_PAGO[p.pago.estado] || p.pago.estado} · {$(p.pago.monto)}
                        {p.pago.tipo ? ` · ${p.pago.tipo.replace(/_/g, " ")}` : ""}
                      </p>
                    )}
                    <label className="block">
                      <span className="text-gray-600">Estado</span>
                      <select
                        value={p.estado}
                        onChange={(e) => cambiarEstado(p, e.target.value)}
                        className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-base bg-white"
                      >
                        {Object.entries(ESTADOS_PEDIDO).map(([k, v]) => (
                          <option key={k} value={k}>{v.texto}</option>
                        ))}
                      </select>
                    </label>
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
