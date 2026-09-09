import { useEffect, useMemo, useState } from "react";
import supabase from "../services/supabase";

const LS_VIP = "vip_sesion";
const WHATSAPP = "5212212034647";
const SERIF = "'Cormorant Garamond', Georgia, serif";
const ORO = "#C6A15B";
const CFG_DEFAULT = { inversion_min: 15000, costo_sesion: 1100, costo_extra: 500 };

function useVipHead() {
  useEffect(() => {
    const fid = "font-cormorant-vip";
    if (!document.getElementById(fid)) {
      const l = document.createElement("link");
      l.id = fid;
      l.rel = "stylesheet";
      l.href =
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap";
      document.head.appendChild(l);
    }
    document.title = "Experiencia privada";
    const mid = "robots-noindex-vip";
    if (!document.getElementById(mid)) {
      const m = document.createElement("meta");
      m.id = mid;
      m.name = "robots";
      m.content = "noindex,nofollow";
      document.head.appendChild(m);
    }
    return () => {
      const m = document.getElementById(mid);
      if (m) m.remove();
    };
  }, []);
}

const fmt = (n) => "$" + (Number(n) || 0).toLocaleString("es-MX");

function puntos(cfg) {
  return [
    "Sesión personalizada de curación de perfumes, uno a uno, para hasta 3 personas.",
    "Durante la sesión atomizamos una muestra de cada perfume que quieras oler, compartida entre los asistentes.",
    `La inversión mínima es de ${fmt(cfg.inversion_min)} MXN, que se cubren por adelantado (transferencia o efectivo) y son 100% redimibles en decants.`,
    "Ese crédito se usa en cualquier perfume del catálogo, al precio normal de la página, sin límite por perfume. Tu inversión define cuántos decants puedes elegir.",
    "El crédito no usado no se reembolsa: queda como saldo en tienda para futuros decants (o, como última opción, en una botella disponible o bajo pedido).",
    "Si durante la sesión quieres llevarte decants por un valor mayor a tu inversión, puedes hacerlo pagando la diferencia en ese momento.",
    "Experiencia disponible únicamente en Puebla, sujeta a disponibilidad de agenda (Tuya y mía).",
  ];
}

const OPCIONES_DIA = [
  "Prefiero entre semana",
  "Prefiero fines de semana",
  "Cualquier día está bien",
];

export default function ExperienciaPrivada() {
  useVipHead();
  const [sesion, setSesion] = useState(null);
  const [username, setUsername] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState("");
  const [cfg, setCfg] = useState(CFG_DEFAULT);

  const [numPersonas, setNumPersonas] = useState(1);
  const [asistentes, setAsistentes] = useState([""]);
  const [perfumesTexto, setPerfumesTexto] = useState("");
  const [dia, setDia] = useState("");
  const [monto, setMonto] = useState("");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_VIP);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.username) {
          setSesion(d);
          setNombre(d.nombre || "");
          setAsistentes([d.nombre || ""]);
        }
      }
    } catch {
      // ignora datos corruptos
    }
  }, []);

  // Config de montos (pública). Si falla, usa los valores por defecto.
  useEffect(() => {
    supabase
      .from("config_vip")
      .select("inversion_min, costo_sesion, costo_extra")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data)
          setCfg({
            inversion_min: Number(data.inversion_min) || CFG_DEFAULT.inversion_min,
            costo_sesion: Number(data.costo_sesion) || CFG_DEFAULT.costo_sesion,
            costo_extra: Number(data.costo_extra) || CFG_DEFAULT.costo_extra,
          });
      })
      .catch(() => {});
  }, []);

  // Ajusta la lista de asistentes al número de personas.
  useEffect(() => {
    setAsistentes((prev) => {
      const n = Math.max(1, Number(numPersonas) || 1);
      const copia = [...prev];
      while (copia.length < n) copia.push("");
      copia.length = n;
      return copia;
    });
  }, [numPersonas]);

  const entrar = async () => {
    const u = username.trim();
    if (!u) return;
    setVerificando(true);
    setError("");
    try {
      const { data, error: rpcError } = await supabase.rpc("validar_vip", {
        p_username: u,
      });
      if (rpcError) throw rpcError;
      const cliente = Array.isArray(data) ? data[0] : data;
      if (cliente && cliente.nombre) {
        const nueva = {
          username: u,
          nombre: cliente.nombre,
          saldo: Number(cliente.saldo) || 0,
        };
        localStorage.setItem(LS_VIP, JSON.stringify(nueva));
        setSesion(nueva);
        setNombre(nueva.nombre);
        setAsistentes([nueva.nombre]);
      } else {
        setError("Acceso no válido. Verifica tu clave de acceso.");
      }
    } catch {
      setError("No pudimos validar tu acceso. Intenta de nuevo en un momento.");
    } finally {
      setVerificando(false);
    }
  };

  const salir = () => {
    localStorage.removeItem(LS_VIP);
    setSesion(null);
    setUsername("");
  };

  const costoSesion = useMemo(() => {
    const n = Math.max(1, Number(numPersonas) || 1);
    return Number(cfg.costo_sesion) + Math.max(0, n - 3) * Number(cfg.costo_extra);
  }, [numPersonas, cfg]);

  const montoNum = Number(monto) || 0;
  const montoValido = montoNum >= Number(cfg.inversion_min);
  const puedeEnviar = montoValido && nombre.trim();

  const setAsistente = (i, val) =>
    setAsistentes((prev) => prev.map((a, idx) => (idx === i ? val : a)));

  const enviar = () => {
    if (!puedeEnviar) return;
    const nombres = asistentes.map((a) => a.trim()).filter(Boolean);
    const lineas = [
      "Hola Diego, quiero agendar una Experiencia Privada.",
      "",
      `Cliente: ${nombre || "-"}`,
      `Personas: ${numPersonas}`,
      `Asistentes: ${nombres.length ? nombres.join(", ") : "por definir"}`,
      `Costo de sesión (no redimible): ${fmt(costoSesion)}`,
      `Inversión en decants (redimible): ${fmt(montoNum)}`,
      `Perfumes de interés: ${perfumesTexto.trim() || "por definir"}`,
      `Preferencia de días: ${dia || "por definir"}`,
    ];
    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lineas.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const fondo = {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 50% -10%, rgba(198,161,91,0.10), transparent 60%), #0b0b0d",
    color: "#e8e4dc",
  };
  const inputStyle = {
    color: "#f4efe6",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(198,161,91,0.30)",
    borderRadius: 2,
  };

  if (!sesion) {
    return (
      <div style={fondo} className="flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center py-20">
          <div className="mx-auto mb-8 h-px w-16" style={{ background: ORO, opacity: 0.6 }} />
          <p className="uppercase text-xs tracking-[0.35em] mb-6" style={{ color: ORO }}>
            Experiencia privada
          </p>
          <h1 className="text-4xl sm:text-5xl leading-tight" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
            Acceso exclusivo
          </h1>
          <p className="mt-4 mb-10 text-gray-400" style={{ fontFamily: SERIF, fontSize: "1.15rem" }}>
            Ingresa tu clave de acceso personal para continuar.
          </p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && entrar()}
            placeholder="Tu clave de acceso"
            className="w-full text-center text-lg tracking-wider py-3 px-4 outline-none"
            style={inputStyle}
          />
          <button
            onClick={entrar}
            disabled={verificando || !username.trim()}
            className="w-full mt-4 py-3 uppercase tracking-[0.2em] text-sm disabled:opacity-40"
            style={{ background: ORO, color: "#0b0b0d", borderRadius: 2, fontWeight: 600 }}
          >
            {verificando ? "Verificando…" : "Entrar"}
          </button>
          {error && <p className="text-sm mt-5" style={{ color: "#d98c8c" }}>{error}</p>}
          <div className="mx-auto mt-12 h-px w-16" style={{ background: ORO, opacity: 0.3 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={fondo}>
      <div className="max-w-2xl mx-auto w-full px-6 py-16">
        <p className="uppercase text-xs tracking-[0.35em] mb-5" style={{ color: ORO }}>
          Experiencia privada
        </p>
        <h1 className="text-4xl sm:text-5xl leading-tight" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
          Bienvenido, {sesion.nombre}
        </h1>

        {sesion.saldo > 0 && (
          <div className="mt-6 inline-block border rounded-sm px-5 py-3" style={{ borderColor: "rgba(198,161,91,0.35)" }}>
            <span className="text-[11px] uppercase tracking-widest text-gray-400">Saldo en tienda</span>
            <div className="text-2xl" style={{ fontFamily: SERIF, color: ORO }}>{fmt(sesion.saldo)}</div>
          </div>
        )}

        <h2 className="text-2xl sm:text-3xl mt-14 mb-2" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
          Sesión de curación de perfumes
        </h2>
        <p className="text-gray-400 mb-6" style={{ fontFamily: SERIF, fontSize: "1.1rem" }}>
          Una experiencia guiada, uno a uno, para descubrir tu próximo aroma sin prisa.
        </p>

        <div className="border-y py-2" style={{ borderColor: "rgba(198,161,91,0.20)" }}>
          {puntos(cfg).map((p, i) => (
            <div key={i} className="flex gap-3 py-3 border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <span style={{ color: ORO }}>—</span>
              <span className="text-gray-300 text-[15px] leading-relaxed">{p}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <div className="rounded-sm px-5 py-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(198,161,91,0.25)" }}>
            <p className="text-[11px] uppercase tracking-widest text-gray-400">Costo de la sesión</p>
            <p className="text-xl mt-1" style={{ fontFamily: SERIF, color: "#f4efe6" }}>{fmt(cfg.costo_sesion)} MXN</p>
            <p className="text-sm text-gray-400 mt-1">
              Fijos, hasta 3 asistentes (+{fmt(cfg.costo_extra)} por persona extra). Cubre la experiencia y <strong>no</strong> es redimible en productos.
            </p>
          </div>
          <div className="rounded-sm px-5 py-4" style={{ background: "rgba(198,161,91,0.08)", border: "1px solid rgba(198,161,91,0.35)" }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: ORO }}>Inversión en decants</p>
            <p className="text-xl mt-1" style={{ fontFamily: SERIF, color: ORO }}>Desde {fmt(cfg.inversion_min)} MXN</p>
            <p className="text-sm text-gray-300 mt-1">
              Mínimo para agendar. Es <strong>100% redimible</strong> en decants del catálogo y define cuántos puedes elegir.
            </p>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl mt-14 mb-6" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
          Agenda tu sesión
        </h2>

        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Número de personas</label>
        <div className="flex items-center gap-3">
          <button onClick={() => setNumPersonas((n) => Math.max(1, Number(n) - 1))} className="w-9 h-9 border text-lg" style={{ borderColor: "rgba(198,161,91,0.4)", color: ORO, borderRadius: 2 }}>−</button>
          <span className="text-xl w-8 text-center" style={{ color: "#f4efe6" }}>{numPersonas}</span>
          <button onClick={() => setNumPersonas((n) => Number(n) + 1)} className="w-9 h-9 border text-lg" style={{ borderColor: "rgba(198,161,91,0.4)", color: ORO, borderRadius: 2 }}>+</button>
          <span className="text-sm text-gray-400 ml-2">Sesión: {fmt(costoSesion)}</span>
        </div>

        {/* Nombres de los asistentes */}
        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2 mt-8">
          Nombre de cada asistente
        </label>
        <div className="flex flex-col gap-2">
          {asistentes.map((a, i) => (
            <input
              key={i}
              type="text"
              value={a}
              onChange={(e) => setAsistente(i, e.target.value)}
              placeholder={`Asistente ${i + 1}`}
              className="w-full py-2.5 px-3 outline-none"
              style={inputStyle}
            />
          ))}
        </div>

        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2 mt-8">
          Monto a invertir en decants
        </label>
        <input
          type="number"
          min={cfg.inversion_min}
          step="1000"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder={`Mínimo ${fmt(cfg.inversion_min)}`}
          className="w-full py-2.5 px-3 outline-none"
          style={inputStyle}
        />
        {monto && !montoValido ? (
          <p className="text-sm mt-2" style={{ color: "#d98c8c" }}>
            La inversión mínima para agendar es de {fmt(cfg.inversion_min)} MXN.
          </p>
        ) : (
          <p className="text-sm mt-2 text-gray-500">
            Este monto es 100% redimible en decants. El costo de la sesión es aparte.
          </p>
        )}

        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2 mt-8">
          Perfumes de interés (opcional)
        </label>
        <textarea
          rows={3}
          value={perfumesTexto}
          onChange={(e) => setPerfumesTexto(e.target.value)}
          placeholder="Escribe los perfumes o casas que te gustaría probar…"
          className="w-full py-2.5 px-3 outline-none resize-none"
          style={inputStyle}
        />

        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3 mt-8">Preferencia de días</label>
        <div className="flex flex-col sm:flex-row gap-2">
          {OPCIONES_DIA.map((o) => (
            <button
              key={o}
              onClick={() => setDia(o)}
              className="flex-1 py-2.5 px-3 text-sm"
              style={dia === o ? { background: ORO, color: "#0b0b0d", borderRadius: 2, fontWeight: 600 } : { ...inputStyle, color: "#e8e4dc" }}
            >
              {o}
            </button>
          ))}
        </div>

        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2 mt-8">Nombre de contacto</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full py-2.5 px-3 outline-none" style={inputStyle} />

        <button
          onClick={enviar}
          disabled={!puedeEnviar}
          className="w-full mt-10 py-3.5 uppercase tracking-[0.2em] text-sm disabled:opacity-40"
          style={{ background: ORO, color: "#0b0b0d", borderRadius: 2, fontWeight: 600 }}
        >
          Solicitar por WhatsApp
        </button>
        {!montoValido && (
          <p className="text-center text-xs text-gray-500 mt-3">
            Indica un monto de al menos {fmt(cfg.inversion_min)} para solicitar tu sesión.
          </p>
        )}

        <button onClick={salir} className="block mx-auto mt-8 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-300">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}