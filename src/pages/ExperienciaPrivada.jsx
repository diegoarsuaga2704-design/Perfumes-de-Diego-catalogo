import { useEffect, useMemo, useState } from "react";
import supabase from "../services/supabase";
import getParfums from "../functions/getParfums";
import { imagenThumb } from "../functions/imagenThumb";

const LS_VIP = "vip_sesion";
const LS_BORRADOR = "vip_borrador";
const WHATSAPP = "5212212034647";
const SERIF = "'Cormorant Garamond', Georgia, serif";
const ORO = "#C6A15B";
const CFG_DEFAULT = {
  inversion_min: 15000,
  costo_sesion: 1100,
  costo_extra: 500,
  inversion_por_perfume: 1000,
};

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
    "Ese crédito se usa en cualquier perfume del catálogo, al precio normal de la página, sin límite por perfume. Tu inversión define cuántos perfumes puedes elegir.",
    "El crédito no usado no se reembolsa: queda como saldo en tienda para futuros decants (o, como última opción, en una botella disponible o bajo pedido).",
    "Si durante la sesión quieres llevarte decants por un valor mayor a tu inversión, puedes hacerlo pagando la diferencia en ese momento.",
    "Experiencia disponible únicamente en Puebla, sujeta a disponibilidad de agenda (nuestra y tuya).",
  ];
}

const OPCIONES_DIA = [
  "Prefiero entre semana",
  "Prefiero fines de semana",
  "Cualquier día está bien",
];

const OPCIONES_EXPERIENCIA = [
  "Quiero que me asesores y me platiques de cada perfume",
  "Prefiero olerlos con calma y decidir por mi cuenta",
  "Una mezcla de ambas",
];

const TYC_EXPERIENCIA = [
  "La experiencia se realiza únicamente dentro de la zona de Angelópolis, Puebla, en el lugar que indique el cliente (casa, oficina u otro).",
  "El lugar debe estar techado y sin luz solar directa, para proteger la integridad de los perfumes.",
  "El cliente debe contar con una mesa o superficie segura y estable donde colocar los frascos durante la sesión.",
  "Los perfumes son propiedad de Perfumes de Diego hasta el momento de su compra. Si el cliente o sus acompañantes derraman, dañan o rompen un frasco, se cobrará el valor completo del perfume.",
  "El costo de la sesión se cubre por adelantado para confirmar la cita y no es reembolsable.",
  "La inversión en decants se acuerda y se cubre por adelantado; el crédito no usado no se reembolsa y queda como saldo en tienda.",
  "Solo participan los asistentes registrados. Personas adicionales se cobran según la tarifa vigente.",
  "La fecha y el horario se confirman por WhatsApp, sujetos a disponibilidad de ambas partes. Para reagendar, avisa con al menos 24 horas de anticipación.",
  "Para cuidar el olfato de todos, se recomienda un espacio ventilado pero sin corrientes de aire fuertes, libre de humo, comida con olores intensos o velas encendidas.",
  "El cliente garantiza un acceso seguro al lugar y la presencia de un adulto responsable durante toda la sesión. Niños y mascotas quedan bajo su responsabilidad, incluidos los daños que pudieran ocasionar.",
];

export default function ExperienciaPrivada() {
  useVipHead();
  const [sesion, setSesion] = useState(null);
  const [username, setUsername] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState("");
  const [cfg, setCfg] = useState(CFG_DEFAULT);

  const [parfums, setParfums] = useState([]);
  const [numPersonas, setNumPersonas] = useState(1);
  const [asistentes, setAsistentes] = useState([""]);
  const [perfumesSel, setPerfumesSel] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [casaFiltro, setCasaFiltro] = useState("");
  const [orden, setOrden] = useState("casa");
  const [dia, setDia] = useState("");
  const [preferencia, setPreferencia] = useState("");
  const [lugar, setLugar] = useState("");
  const [aceptaTyc, setAceptaTyc] = useState(false);
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

  // Recupera el borrador del formulario (sobrevive recargas).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_BORRADOR);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.numPersonas) setNumPersonas(d.numPersonas);
        if (Array.isArray(d.asistentes)) setAsistentes(d.asistentes);
        if (d.monto != null) setMonto(String(d.monto));
        if (Array.isArray(d.perfumesSel)) setPerfumesSel(d.perfumesSel);
        if (d.dia) setDia(d.dia);
        if (d.preferencia) setPreferencia(d.preferencia);
        if (d.lugar) setLugar(d.lugar);
        if (d.aceptaTyc) setAceptaTyc(d.aceptaTyc);
        if (d.nombre) setNombre(d.nombre);
      }
    } catch {
      // ignora borrador corrupto
    }
  }, []);

  // Guarda el borrador en cada cambio.
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_BORRADOR,
        JSON.stringify({
          numPersonas,
          asistentes,
          monto,
          perfumesSel,
          dia,
          preferencia,
          lugar,
          aceptaTyc,
          nombre,
        }),
      );
    } catch {
      // sin persistencia si falla
    }
  }, [numPersonas, asistentes, monto, perfumesSel, dia, preferencia, lugar, aceptaTyc, nombre]);

  useEffect(() => {
    supabase
      .from("config_vip")
      .select("inversion_min, costo_sesion, costo_extra, inversion_por_perfume")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data)
          setCfg({
            inversion_min: Number(data.inversion_min) || CFG_DEFAULT.inversion_min,
            costo_sesion: Number(data.costo_sesion) || CFG_DEFAULT.costo_sesion,
            costo_extra: Number(data.costo_extra) || CFG_DEFAULT.costo_extra,
            inversion_por_perfume:
              Number(data.inversion_por_perfume) || CFG_DEFAULT.inversion_por_perfume,
          });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sesion) return;
    getParfums()
      .then((p) => setParfums(p || []))
      .catch(() => setParfums([]));
  }, [sesion]);

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
    localStorage.removeItem(LS_BORRADOR);
    setSesion(null);
    setUsername("");
  };

  const costoSesion = useMemo(() => {
    const n = Math.max(1, Number(numPersonas) || 1);
    return Number(cfg.costo_sesion) + Math.max(0, n - 3) * Number(cfg.costo_extra);
  }, [numPersonas, cfg]);

  const montoNum = Number(monto) || 0;
  const montoValido = montoNum >= Number(cfg.inversion_min);
  const maxPerfumes = Math.floor(
    montoNum / (Number(cfg.inversion_por_perfume) || 1000),
  );

  const casas = useMemo(
    () =>
      [...new Set(parfums.map((p) => p.casa).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [parfums],
  );

  const listaFiltrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    let lista = parfums.filter((p) => {
      if (casaFiltro && p.casa !== casaFiltro) return false;
      if (q && !(p.nombre?.toLowerCase().includes(q) || p.casa?.toLowerCase().includes(q)))
        return false;
      return true;
    });
    if (orden === "precio_asc")
      lista = [...lista].sort((a, b) => (a.precio || 0) - (b.precio || 0));
    else if (orden === "precio_desc")
      lista = [...lista].sort((a, b) => (b.precio || 0) - (a.precio || 0));
    else
      lista = [...lista].sort(
        (a, b) =>
          (a.casa || "").localeCompare(b.casa || "", "es") ||
          (a.nombre || "").localeCompare(b.nombre || "", "es"),
      );
    return lista;
  }, [parfums, busqueda, casaFiltro, orden]);

  // Agrupado A-Z por casa (solo cuando el orden es por casa).
  const grupos = useMemo(() => {
    if (orden !== "casa") return null;
    const map = new Map();
    for (const p of listaFiltrada) {
      const c = p.casa || "—";
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(p);
    }
    return [...map.entries()];
  }, [listaFiltrada, orden]);

  const seleccionado = (nombrePerf) => perfumesSel.includes(nombrePerf);
  const togglePerfume = (nombrePerf) => {
    setPerfumesSel((prev) => {
      if (prev.includes(nombrePerf)) return prev.filter((x) => x !== nombrePerf);
      if (prev.length >= maxPerfumes) return prev; // no pasar del límite
      return [...prev, nombrePerf];
    });
  };

  const setAsistente = (i, val) =>
    setAsistentes((prev) => prev.map((a, idx) => (idx === i ? val : a)));

  const puedeEnviar =
    montoValido &&
    perfumesSel.length >= 1 &&
    nombre.trim() &&
    lugar.trim() &&
    aceptaTyc;

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
      `Perfumes que puede elegir: hasta ${maxPerfumes}`,
      `Perfumes de interés (${perfumesSel.length}): ${perfumesSel.join(", ")}`,
      `Preferencia de experiencia: ${preferencia || "por definir"}`,
      `Lugar (Angelópolis): ${lugar.trim() || "por definir"}`,
      `Preferencia de días: ${dia || "por definir"}`,
      "Acepta los términos de la experiencia: Sí",
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

  const tarjetaPerfume = (p) => {
    const sel = seleccionado(p.nombre);
    const bloqueado = !sel && perfumesSel.length >= maxPerfumes;
    return (
      <button
        key={p.id}
        onClick={() => togglePerfume(p.nombre)}
        disabled={bloqueado}
        className="flex items-center gap-3 p-2 text-left transition-colors disabled:opacity-30"
        style={{
          border: sel ? `1px solid ${ORO}` : "1px solid rgba(255,255,255,0.08)",
          background: sel ? "rgba(198,161,91,0.12)" : "rgba(255,255,255,0.02)",
          borderRadius: 2,
        }}
      >
        <img
          src={imagenThumb(p.image, 120)}
          alt={p.nombre}
          loading="lazy"
          className="w-12 h-12 object-cover rounded-sm shrink-0 bg-black/30"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm truncate" style={{ color: "#f4efe6" }}>{p.nombre}</p>
          <p className="text-xs text-gray-400 truncate">{p.casa}</p>
          <p className="text-xs" style={{ color: ORO }}>
            {fmt(p.precio)}{!p.stock ? "/ml" : ""}
          </p>
        </div>
        {sel && <span style={{ color: ORO }}>✓</span>}
      </button>
    );
  };

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
              100% redimible en decants. Por cada {fmt(cfg.inversion_por_perfume)} desbloqueas 1 perfume para elegir.
            </p>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl mt-14 mb-6" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
          Agenda tu sesión
        </h2>

        {/* Personas */}
        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Número de personas</label>
        <div className="flex items-center gap-3">
          <button onClick={() => setNumPersonas((n) => Math.max(1, Number(n) - 1))} className="w-9 h-9 border text-lg" style={{ borderColor: "rgba(198,161,91,0.4)", color: ORO, borderRadius: 2 }}>−</button>
          <span className="text-xl w-8 text-center" style={{ color: "#f4efe6" }}>{numPersonas}</span>
          <button onClick={() => setNumPersonas((n) => Number(n) + 1)} className="w-9 h-9 border text-lg" style={{ borderColor: "rgba(198,161,91,0.4)", color: ORO, borderRadius: 2 }}>+</button>
          <span className="text-sm text-gray-400 ml-2">Sesión: {fmt(costoSesion)}</span>
        </div>

        {/* Asistentes */}
        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2 mt-8">Nombre de cada asistente</label>
        <div className="flex flex-col gap-2">
          {asistentes.map((a, i) => (
            <input key={i} type="text" value={a} onChange={(e) => setAsistente(i, e.target.value)} placeholder={`Asistente ${i + 1}`} className="w-full py-2.5 px-3 outline-none" style={inputStyle} />
          ))}
        </div>

        {/* Monto con $ y 6 dígitos */}
        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2 mt-8">
          Monto a invertir en decants (mínimo {fmt(cfg.inversion_min)})
        </label>
        <div className="flex items-center" style={inputStyle}>
          <span className="pl-3 pr-1 text-lg" style={{ color: ORO }}>$</span>
          <input
            type="text"
            inputMode="numeric"
            value={monto}
            onChange={(e) => setMonto(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
            className="w-full py-2.5 pr-3 bg-transparent outline-none"
            style={{ color: "#f4efe6" }}
          />
        </div>
        {monto && !montoValido ? (
          <p className="text-sm mt-2" style={{ color: "#d98c8c" }}>
            La inversión mínima para agendar es de {fmt(cfg.inversion_min)} MXN.
          </p>
        ) : montoValido ? (
          <p className="text-sm mt-2" style={{ color: ORO }}>
            Con esta inversión puedes elegir hasta <strong>{maxPerfumes}</strong> perfumes.
          </p>
        ) : (
          <p className="text-sm mt-2 text-gray-500">
            Mientras mayor sea tu inversión, más perfumes podrás elegir para oler
            (1 por cada {fmt(cfg.inversion_por_perfume)}). 100% redimible en decants;
            el costo de la sesión es aparte.
          </p>
        )}

        {/* Perfumes de interés — catálogo */}
        <div className="flex items-center justify-between mt-10 mb-3">
          <label className="block text-xs uppercase tracking-widest text-gray-400">
            Perfumes de interés
          </label>
          <span className="text-sm" style={{ color: ORO }}>
            {perfumesSel.length} / {maxPerfumes || 0}
          </span>
        </div>

        {maxPerfumes < 1 ? (
          <p className="text-sm text-gray-500">
            Indica tu inversión arriba para desbloquear tu selección de perfumes.
          </p>
        ) : (
          <>
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar…"
                className="flex-1 py-2 px-3 outline-none text-sm"
                style={inputStyle}
              />
              <select value={casaFiltro} onChange={(e) => setCasaFiltro(e.target.value)} className="py-2 px-3 text-sm" style={inputStyle}>
                <option value="">Todas las casas</option>
                {casas.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select value={orden} onChange={(e) => setOrden(e.target.value)} className="py-2 px-3 text-sm" style={inputStyle}>
                <option value="casa">Casa (A-Z)</option>
                <option value="precio_asc">Precio: menor a mayor</option>
                <option value="precio_desc">Precio: mayor a menor</option>
              </select>
            </div>

            {/* Seleccionados */}
            {perfumesSel.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {perfumesSel.map((p) => (
                  <span key={p} className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-sm" style={{ background: "rgba(198,161,91,0.15)", color: "#f4efe6", border: `1px solid ${ORO}` }}>
                    {p}
                    <button onClick={() => togglePerfume(p)} style={{ color: ORO }}>×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Lista */}
            <div className="max-h-[420px] overflow-y-auto pr-1" style={{ border: "1px solid rgba(198,161,91,0.15)", borderRadius: 2 }}>
              {orden === "casa" && grupos
                ? grupos.map(([casa, items]) => (
                    <div key={casa}>
                      <p className="px-3 py-2 text-xs uppercase tracking-widest sticky top-0" style={{ color: ORO, background: "#111013" }}>
                        {casa}
                      </p>
                      <div className="grid grid-cols-1 gap-2 p-2">
                        {items.map(tarjetaPerfume)}
                      </div>
                    </div>
                  ))
                : (
                  <div className="grid grid-cols-1 gap-2 p-2">
                    {listaFiltrada.map(tarjetaPerfume)}
                  </div>
                )}
              {listaFiltrada.length === 0 && (
                <p className="text-sm text-gray-500 p-4 text-center">Sin resultados.</p>
              )}
            </div>
          </>
        )}

        {/* Preferencia de experiencia */}
        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3 mt-10">
          ¿Cómo prefieres vivir la sesión?
        </label>
        <div className="flex flex-col gap-2">
          {OPCIONES_EXPERIENCIA.map((o) => (
            <button
              key={o}
              onClick={() => setPreferencia(o)}
              className="py-2.5 px-3 text-sm text-left"
              style={preferencia === o ? { background: ORO, color: "#0b0b0d", borderRadius: 2, fontWeight: 600 } : { ...inputStyle, color: "#e8e4dc" }}
            >
              {o}
            </button>
          ))}
        </div>

        {/* Lugar */}
        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2 mt-8">
          Lugar de la sesión (dentro de Angelópolis)
        </label>
        <input
          type="text"
          value={lugar}
          onChange={(e) => setLugar(e.target.value)}
          placeholder="Casa, oficina, dirección o referencia…"
          className="w-full py-2.5 px-3 outline-none"
          style={inputStyle}
        />
        <p className="text-xs text-gray-500 mt-1">
          Debe ser un espacio techado, sin luz solar directa, con una mesa o
          superficie segura para colocar los perfumes.
        </p>

        {/* Preferencia de día */}
        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3 mt-8">Preferencia de días</label>
        <div className="flex flex-col sm:flex-row gap-2">
          {OPCIONES_DIA.map((o) => (
            <button key={o} onClick={() => setDia(o)} className="flex-1 py-2.5 px-3 text-sm" style={dia === o ? { background: ORO, color: "#0b0b0d", borderRadius: 2, fontWeight: 600 } : { ...inputStyle, color: "#e8e4dc" }}>
              {o}
            </button>
          ))}
        </div>

        {/* Términos de la experiencia */}
        <h3 className="text-xl mt-12 mb-3" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
          Términos de la experiencia
        </h3>
        <div className="border-y py-1" style={{ borderColor: "rgba(198,161,91,0.20)" }}>
          {TYC_EXPERIENCIA.map((t, i) => (
            <div key={i} className="flex gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <span style={{ color: ORO }}>—</span>
              <span className="text-gray-400 text-[13px] leading-relaxed">{t}</span>
            </div>
          ))}
        </div>
        <label className="flex items-start gap-3 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={aceptaTyc}
            onChange={(e) => setAceptaTyc(e.target.checked)}
            className="mt-1 accent-[#C6A15B] w-4 h-4"
          />
          <span className="text-sm text-gray-300">
            He leído y acepto los términos de la experiencia.
          </span>
        </label>

        <button
          onClick={enviar}
          disabled={!puedeEnviar}
          className="w-full mt-8 py-3.5 uppercase tracking-[0.2em] text-sm disabled:opacity-40"
          style={{ background: ORO, color: "#0b0b0d", borderRadius: 2, fontWeight: 600 }}
        >
          Solicitar por WhatsApp
        </button>
        {!puedeEnviar && (
          <p className="text-center text-xs text-gray-500 mt-3">
            Completa tu inversión, elige mínimo 1 perfume, indica el lugar y
            acepta los términos para solicitar tu sesión.
          </p>
        )}

        <button onClick={salir} className="block mx-auto mt-8 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-300">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}