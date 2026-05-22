import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Percent,
  ShoppingBag,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getFinanzasData } from "../functions/getFinanzas";

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const fmt = (n) =>
  "$" +
  Math.round(Number(n || 0)).toLocaleString("es-MX");

const fmtCompact = (n) => {
  const num = Number(n || 0);
  if (Math.abs(num) >= 1_000_000)
    return "$" + (num / 1_000_000).toFixed(1) + "M";
  if (Math.abs(num) >= 1_000) return "$" + Math.round(num / 1_000) + "k";
  return "$" + Math.round(num);
};

export default function AdminFinanzas() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    pedidos: [],
    decants: [],
    clientes: [],
    proveedores: [],
  });
  const [anio, setAnio] = useState("");

  useEffect(() => {
    setLoading(true);
    getFinanzasData()
      .then((d) => {
        setData(d);
        // Pre-seleccionar el año actual si existe data
        const aniosDisp = new Set();
        d.pedidos.forEach((p) => p.fecha && aniosDisp.add(String(p.fecha).slice(0, 4)));
        d.decants.forEach((dd) => dd.fecha && aniosDisp.add(String(dd.fecha).slice(0, 4)));
        const anioActual = String(new Date().getFullYear());
        if (aniosDisp.has(anioActual)) setAnio(anioActual);
      })
      .catch((err) => {
        console.error(err);
        alert("Error cargando datos financieros");
      })
      .finally(() => setLoading(false));
  }, []);

  // ===== Años disponibles =====
  const aniosDisponibles = useMemo(() => {
    const set = new Set();
    data.pedidos.forEach((p) => p.fecha && set.add(String(p.fecha).slice(0, 4)));
    data.decants.forEach((d) => d.fecha && set.add(String(d.fecha).slice(0, 4)));
    return Array.from(set).sort().reverse();
  }, [data]);

  // ===== Filtrado por año =====
  const pedidosFiltrados = useMemo(() => {
    if (!anio) return data.pedidos;
    return data.pedidos.filter(
      (p) => p.fecha && String(p.fecha).startsWith(anio),
    );
  }, [data.pedidos, anio]);

  const decantsFiltrados = useMemo(() => {
    if (!anio) return data.decants;
    return data.decants.filter(
      (d) => d.fecha && String(d.fecha).startsWith(anio),
    );
  }, [data.decants, anio]);

  // ===== KPIs =====
  const kpis = useMemo(() => {
    let totalVendidoBot = 0,
      totalInvertido = 0,
      totalRevenueBot = 0;
    let totalDecants = 0,
      botellasVendidas = 0;
    let conMargen = 0,
      sumMargen = 0;

    pedidosFiltrados.forEach((p) => {
      if (p.sell) totalVendidoBot += Number(p.sell);
      if (p.buy_total) totalInvertido += Number(p.buy_total);
      if (p.revenue) totalRevenueBot += Number(p.revenue);
      if (p.cliente_id && p.sell) botellasVendidas++;
      if (p.margin_pct != null) {
        conMargen++;
        sumMargen += Number(p.margin_pct);
      }
    });

    decantsFiltrados.forEach((d) => {
      if (d.monto) totalDecants += Number(d.monto);
    });

    const clientesActivos = new Set();
    pedidosFiltrados.forEach(
      (p) => p.cliente_id && p.sell && clientesActivos.add(p.cliente_id),
    );
    decantsFiltrados.forEach(
      (d) => d.cliente_id && d.monto && clientesActivos.add(d.cliente_id),
    );

    return {
      totalVendido: totalVendidoBot + totalDecants,
      totalVendidoBot,
      totalVendidoDecants: totalDecants,
      totalInvertido,
      totalRevenue: totalRevenueBot + totalDecants, // decants = ganancia directa
      margenPromedio: conMargen > 0 ? sumMargen / conMargen : 0,
      botellasVendidas,
      clientesActivos: clientesActivos.size,
    };
  }, [pedidosFiltrados, decantsFiltrados]);

  // ===== Datos para gráfica mensual =====
  const dataMensual = useMemo(() => {
    const meses = {};
    // Pre-llenar 12 meses cuando hay año filtrado
    if (anio) {
      for (let m = 0; m < 12; m++) {
        meses[m] = {
          mes: MESES[m],
          invertido: 0,
          vendido: 0,
          revenue: 0,
        };
      }
    }

    pedidosFiltrados.forEach((p) => {
      if (!p.fecha) return;
      const mes = new Date(p.fecha + "T12:00:00").getMonth();
      if (!meses[mes])
        meses[mes] = { mes: MESES[mes], invertido: 0, vendido: 0, revenue: 0 };
      if (p.buy_total) meses[mes].invertido += Number(p.buy_total);
      if (p.sell) meses[mes].vendido += Number(p.sell);
      if (p.revenue) meses[mes].revenue += Number(p.revenue);
    });

    decantsFiltrados.forEach((d) => {
      if (!d.fecha) return;
      const mes = new Date(d.fecha + "T12:00:00").getMonth();
      if (!meses[mes])
        meses[mes] = { mes: MESES[mes], invertido: 0, vendido: 0, revenue: 0 };
      if (d.monto) {
        meses[mes].vendido += Number(d.monto);
        meses[mes].revenue += Number(d.monto);
      }
    });

    return Object.entries(meses)
      .map(([k, v]) => ({ ...v, _orden: Number(k) }))
      .sort((a, b) => a._orden - b._orden);
  }, [pedidosFiltrados, decantsFiltrados, anio]);

  // ===== Top clientes =====
  const topClientes = useMemo(() => {
    const stats = {};
    pedidosFiltrados.forEach((p) => {
      if (!p.cliente_id || !p.sell) return;
      if (!stats[p.cliente_id])
        stats[p.cliente_id] = {
          id: p.cliente_id,
          botellas: 0,
          decants: 0,
          total: 0,
        };
      stats[p.cliente_id].botellas++;
      stats[p.cliente_id].total += Number(p.sell);
    });
    decantsFiltrados.forEach((d) => {
      if (!d.cliente_id || !d.monto) return;
      if (!stats[d.cliente_id])
        stats[d.cliente_id] = {
          id: d.cliente_id,
          botellas: 0,
          decants: 0,
          total: 0,
        };
      stats[d.cliente_id].decants++;
      stats[d.cliente_id].total += Number(d.monto);
    });

    return Object.values(stats)
      .map((s) => {
        const c = data.clientes.find((cc) => cc.id === s.id);
        return {
          ...s,
          nombre: c?.nombre || "—",
          es_propio: c?.es_propio,
        };
      })
      .filter((s) => !s.es_propio) // excluir el propio Diego
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [pedidosFiltrados, decantsFiltrados, data.clientes]);

  // ===== Top proveedores =====
  const topProveedores = useMemo(() => {
    const stats = {};
    pedidosFiltrados.forEach((p) => {
      if (!p.proveedor_id) return;
      if (!stats[p.proveedor_id])
        stats[p.proveedor_id] = {
          id: p.proveedor_id,
          pedidos: 0,
          invertido: 0,
        };
      stats[p.proveedor_id].pedidos++;
      if (p.buy_total) stats[p.proveedor_id].invertido += Number(p.buy_total);
    });

    return Object.values(stats)
      .map((s) => {
        const pr = data.proveedores.find((pp) => pp.id === s.id);
        return { ...s, nombre: pr?.nombre || "—" };
      })
      .sort((a, b) => b.invertido - a.invertido)
      .slice(0, 10);
  }, [pedidosFiltrados, data.proveedores]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 hover:text-[#D4AF7A] transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm hidden sm:inline">Volver</span>
          </button>
          <h1 className="text-base sm:text-lg font-bold">Finanzas</h1>
          <div className="flex items-center gap-2">
            <select
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
            >
              <option value="">Todos los años</option>
              {aniosDisponibles.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {loading ? (
          <p className="text-center text-gray-500 py-12">Cargando...</p>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <KpiCard
                icon={DollarSign}
                label="Vendido"
                value={fmt(kpis.totalVendido)}
                sub={`Bot ${fmtCompact(kpis.totalVendidoBot)} + Dec ${fmtCompact(kpis.totalVendidoDecants)}`}
              />
              <KpiCard
                icon={ShoppingBag}
                label="Invertido"
                value={fmt(kpis.totalInvertido)}
                sub="Solo botellas"
              />
              <KpiCard
                icon={TrendingUp}
                label="Revenue"
                value={fmt(kpis.totalRevenue)}
                sub="Vendido − Invertido"
                accent="green"
              />
              <KpiCard
                icon={Percent}
                label="Margen prom."
                value={kpis.margenPromedio.toFixed(1) + "%"}
                sub="Promedio por botella"
              />
              <KpiCard
                icon={Package}
                label="Botellas"
                value={kpis.botellasVendidas.toLocaleString("es-MX")}
                sub="Con cliente asignado"
              />
              <KpiCard
                icon={Users}
                label="Clientes"
                value={kpis.clientesActivos.toLocaleString("es-MX")}
                sub="Compraron al menos 1"
              />
            </div>

            {/* Gráfica: Revenue por mes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Revenue por mes
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dataMensual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => fmt(v)}
                    labelStyle={{ color: "#111" }}
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica: Invertido vs Vendido por mes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Invertido vs Vendido por mes
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dataMensual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => fmt(v)}
                    labelStyle={{ color: "#111" }}
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="invertido"
                    name="Invertido"
                    fill="#94a3b8"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="vendido"
                    name="Vendido"
                    fill="#A47E3B"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top clientes y proveedores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Top 10 clientes
                </h2>
                {topClientes.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    Sin datos en este periodo.
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-left">
                        <th className="py-2 font-normal">#</th>
                        <th className="py-2 font-normal">Cliente</th>
                        <th className="py-2 font-normal text-center">Bot</th>
                        <th className="py-2 font-normal text-center">Dec</th>
                        <th className="py-2 font-normal text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topClientes.map((c, i) => (
                        <tr
                          key={c.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-2 text-gray-400">{i + 1}</td>
                          <td className="py-2 font-medium text-gray-900">
                            {c.nombre}
                          </td>
                          <td className="py-2 text-center text-gray-600">
                            {c.botellas}
                          </td>
                          <td className="py-2 text-center text-gray-600">
                            {c.decants}
                          </td>
                          <td className="py-2 text-right font-semibold text-gray-900">
                            {fmt(c.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Top 10 proveedores
                </h2>
                {topProveedores.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    Sin datos en este periodo.
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-left">
                        <th className="py-2 font-normal">#</th>
                        <th className="py-2 font-normal">Proveedor</th>
                        <th className="py-2 font-normal text-center">
                          Pedidos
                        </th>
                        <th className="py-2 font-normal text-right">
                          Invertido
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProveedores.map((p, i) => (
                        <tr
                          key={p.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-2 text-gray-400">{i + 1}</td>
                          <td className="py-2 font-medium text-gray-900">
                            {p.nombre}
                          </td>
                          <td className="py-2 text-center text-gray-600">
                            {p.pedidos}
                          </td>
                          <td className="py-2 text-right font-semibold text-gray-900">
                            {fmt(p.invertido)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  const valueColor =
    accent === "green" ? "text-green-700" : "text-gray-900";
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">
          {label}
        </span>
        <Icon size={16} className="text-[#A47E3B]" />
      </div>
      <div className={`text-lg lg:text-xl font-bold ${valueColor}`}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-gray-400 mt-1 truncate">{sub}</div>
      )}
    </div>
  );
}
