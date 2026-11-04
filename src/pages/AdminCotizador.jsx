import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, RefreshCw } from "lucide-react";
import { getTipoCambio, calcularCotizacion } from "../functions/cotizador";
import { formatPrecio } from "../functions/formatPrecio";

// Ajustes que casi no cambian (impuestos, ganancia): se recuerdan en
// este navegador para no capturarlos cada vez.
const KEY_AJUSTES = "admin_cotizador_ajustes";
const AJUSTES_BASE = {
  modoGanancia: "pesos",
  ganancia: 800,
  gananciaPct: 20,
  iva: 16,
  isr: 2.5,
  redondeo: 10,
};
const leerAjustes = () => {
  try {
    return { ...AJUSTES_BASE, ...JSON.parse(localStorage.getItem(KEY_AJUSTES) || "{}") };
  } catch {
    return AJUSTES_BASE;
  }
};

const $ = (n, dec = 0) => `$${formatPrecio(n, dec)}`;

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

  const mensaje = useMemo(() => {
    const titulo = `${nombre.trim()}${ml ? ` ${ml} ml` : ""}`;
    return [
      "¡Hola! Te comparto la cotización:",
      "",
      `Perfume: ${nombre.trim()}`,
      ml ? `Tamaño: ${ml} ml` : null,
      `Precio: ${$(r.precio)} + envío`,
      "",
      `¿Te aparto ${titulo}?`,
    ]
      .filter((l) => l !== null)
      .join("\n");
  }, [nombre, ml, r]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
    } catch {
      const t = document.createElement("textarea");
      t.value = mensaje;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
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
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Tamaño (ml)">
                <input className={INPUT} inputMode="decimal" value={ml} onChange={(e) => setMl(e.target.value)} placeholder="100" />
              </Campo>
              <Campo label="Te cuesta (USD)">
                <input className={INPUT} inputMode="decimal" value={costoUsd} onChange={(e) => setCostoUsd(e.target.value)} placeholder="250" />
              </Campo>
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
              <Campo label="Redondear a" ayuda="Hacia arriba; 0 = sin redondeo">
                <select className={INPUT} value={ajustes.redondeo} onChange={(e) => cambiarAjuste("redondeo", Number(e.target.value))}>
                  {[0, 10, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? "Sin redondeo" : `$${n}`}
                    </option>
                  ))}
                </select>
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
              {r.gananciaReal - r.gananciaMxn > 0.5 ? " (el redondeo suma un poco)" : ""}.
            </div>
          </section>

          <section className={`${CARD} space-y-3`}>
            <h2 className="font-semibold text-gray-900">Mensaje para el cliente</h2>
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
          </section>
        </div>
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
