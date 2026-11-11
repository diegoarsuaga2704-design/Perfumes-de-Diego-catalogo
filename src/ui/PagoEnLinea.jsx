import { useState } from "react";
import { track } from "@vercel/analytics";
import { Lock } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPrecio } from "../functions/formatPrecio";
import { numeroPedidoActual } from "../functions/pedidosWeb";

const KEY_ENVIO = "perfumes-diego-datos-envio";

const ESTADOS_MX = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

const VACIO = {
  nombre: "",
  telefono: "",
  email: "",
  calle: "",
  colonia: "",
  ciudad: "",
  estado: "",
  cp: "",
  referencias: "",
};

function leerGuardado() {
  try {
    return { ...VACIO, ...JSON.parse(localStorage.getItem(KEY_ENVIO) || "{}") };
  } catch {
    return { ...VACIO };
  }
}

const inputCls =
  "w-full border border-gray-300 rounded-md px-3 py-2.5 text-base bg-white focus:ring-2 focus:ring-[#A47E3B] focus:outline-none";

function Campo({ label, children, opcional }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {opcional && <span className="text-gray-400 font-normal"> (opcional)</span>}
      </span>
      {children}
    </label>
  );
}

// Pago con Mercado Pago: pide los datos de envío y manda al cliente a pagar.
// El precio final lo calcula el servidor con los precios de la base de datos.
export default function PagoEnLinea({ postalCode = "", totalMostrado = 0 }) {
  const { cartItems = [], discountCode = "", isDiscountApplied = false } = useCart() || {};
  const [datos, setDatos] = useState(() => {
    const g = leerGuardado();
    return { ...g, cp: g.cp || postalCode || "" };
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => {
    let v = e.target.value;
    if (k === "telefono") v = v.replace(/[^\d+\s]/g, "").slice(0, 16);
    if (k === "cp") v = v.replace(/\D/g, "").slice(0, 5);
    setDatos((d) => ({ ...d, [k]: v }));
    if (error) setError("");
  };

  const pagar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError("");
    try {
      localStorage.setItem(KEY_ENVIO, JSON.stringify(datos));
      if (datos.cp.length === 5) localStorage.setItem("perfumes-diego-cp", datos.cp);
    } catch {
      // sin localStorage
    }
    try {
      const numero = await numeroPedidoActual();
      track("pago_linea_intento", { total: totalMostrado });
      const r = await fetch("/api/mp-crear-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero,
          codigo: isDiscountApplied ? discountCode : "",
          items: cartItems.map((it) => ({
            id: it.id,
            tipoVenta: it.tipoVenta,
            mililitros: it.mililitros,
            cantidad: it.cantidad,
          })),
          cliente: datos,
        }),
      });
      const res = await r.json().catch(() => ({}));
      if (!r.ok || !res.url) {
        setError(res.error || "No se pudo abrir el pago. Intenta de nuevo o pídelo por WhatsApp.");
        setEnviando(false);
        return;
      }
      window.location.href = res.url;
    } catch {
      setError("No hay conexión. Revisa tu internet e intenta de nuevo.");
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={pagar} className="space-y-3">
      <p className="text-sm text-gray-600">¿A dónde te lo envío?</p>

      <Campo label="Nombre completo">
        <input value={datos.nombre} onChange={set("nombre")} autoComplete="name" required className={inputCls} />
      </Campo>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo label="WhatsApp">
          <input
            value={datos.telefono}
            onChange={set("telefono")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="10 dígitos"
            required
            className={inputCls}
          />
        </Campo>
        <Campo label="Correo">
          <input
            value={datos.email}
            onChange={set("email")}
            type="email"
            autoComplete="email"
            required
            className={inputCls}
          />
        </Campo>
      </div>
      <Campo label="Calle y número">
        <input value={datos.calle} onChange={set("calle")} autoComplete="street-address" required className={inputCls} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Colonia">
          <input value={datos.colonia} onChange={set("colonia")} required className={inputCls} />
        </Campo>
        <Campo label="Código postal">
          <input
            value={datos.cp}
            onChange={set("cp")}
            inputMode="numeric"
            autoComplete="postal-code"
            required
            className={inputCls}
          />
        </Campo>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Ciudad o municipio">
          <input value={datos.ciudad} onChange={set("ciudad")} autoComplete="address-level2" required className={inputCls} />
        </Campo>
        <Campo label="Estado">
          <select value={datos.estado} onChange={set("estado")} required className={inputCls}>
            <option value="">Elige</option>
            {ESTADOS_MX.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <Campo label="Referencias" opcional>
        <input
          value={datos.referencias}
          onChange={set("referencias")}
          placeholder="Entre calles, color de la casa…"
          className={inputCls}
        />
      </Campo>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full inline-flex items-center justify-center gap-2 bg-[#A47E3B] hover:bg-[#D4AF7A] active:bg-[#8B6A30] text-white py-3 rounded-md font-semibold transition-colors disabled:opacity-60"
      >
        <Lock size={16} />
        {enviando ? "Abriendo Mercado Pago…" : `Pagar $${formatPrecio(totalMostrado)}`}
      </button>
      <p className="text-center text-[11px] leading-relaxed text-gray-500">
        Pago seguro con Mercado Pago: tarjeta de crédito o débito, OXXO o saldo de Mercado Pago.
        Si tu código postal es zona extendida de DHL, te escribo por WhatsApp para el ajuste.
      </p>
    </form>
  );
}
