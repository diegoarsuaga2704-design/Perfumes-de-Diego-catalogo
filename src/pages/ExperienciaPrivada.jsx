import { useEffect, useMemo, useState, useCallback, memo, useRef } from "react";
import supabase from "../services/supabase";
import { useParfums } from "../context/ParfumsContext";
import { imagenThumb } from "../functions/imagenThumb";
import {
  calcularPrecioDecant,
  getOpcionesMililitros,
} from "../functions/pricingDecant";

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
    const cssId = "vip-mobile-css";
    if (!document.getElementById(cssId)) {
      const st = document.createElement("style");
      st.id = cssId;
      // iPhone hace zoom al tocar campos con letra < 16px; esto lo evita.
      st.textContent =
        "[data-vip] input, [data-vip] textarea, [data-vip] select { font-size: 16px !important; }";
      document.head.appendChild(st);
    }
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

// Fecha que ve el cliente: la acordada con Diego, o "por confirmar".
// Las sesiones registradas desde el admin solo traen `fecha` (sin hora).
function fechaSesionTexto(sx) {
  if (sx?.fecha_acordada) {
    return new Date(sx.fecha_acordada).toLocaleString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (sx?.fecha) {
    const d = new Date(String(sx.fecha).slice(0, 10) + "T12:00:00");
    if (!isNaN(d)) {
      return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
    }
  }
  return null;
}

// Costo de la sesión (no redimible): fijo hasta 3 personas + extra por persona.
function costoSesionPara(numPersonas, cfg) {
  const n = Math.max(1, Number(numPersonas) || 1);
  return Number(cfg.costo_sesion) + Math.max(0, n - 3) * Number(cfg.costo_extra);
}

// Crédito de la sesión: lo declarado al agendar, o la recarga registrada en el admin.
const creditoSesion = (sx) => Number(sx?.inversion_declarada) || Number(sx?.recarga) || 0;

// Borrador del formulario guardado en el navegador (sobrevive recargas).
function leerBorrador() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_BORRADOR) || "null");
    return d && typeof d === "object" ? d : {};
  } catch {
    return {};
  }
}

// Ajusta la lista de asistentes al número de personas sin perder nombres.
function ajustarAsistentes(lista, n) {
  const copia = (Array.isArray(lista) ? lista : []).slice(0, n);
  while (copia.length < n) copia.push("");
  return copia;
}

const fmt = (n) => "$" + (Number(n) || 0).toLocaleString("es-MX");

function puntos(cfg) {
  return [
    "Sesión personalizada de curación de perfumes, uno a uno, para hasta 3 personas.",
    "Durante la sesión atomizamos una muestra de cada perfume que quieras oler, compartida entre los asistentes.",
    `La inversión mínima es de ${fmt(cfg.inversion_min)} MXN, que se pagan al final de la sesión (transferencia o efectivo) y son 100% redimibles en decants.`,
    "Ese crédito se usa en cualquier perfume del catálogo, al precio normal de la página, sin límite por perfume. Tu inversión define cuántos perfumes puedes elegir.",
    "El crédito no usado no se reembolsa: queda como saldo en tienda para futuros decants (o, como última opción, en una botella disponible o bajo pedido).",
    "Si durante la sesión quieres llevarte decants por un valor mayor a tu inversión, puedes hacerlo pagando la diferencia al final de la sesión.",
    "Experiencia disponible únicamente en Puebla, sujeta a disponibilidad de agenda (nuestra y tuya).",
  ];
}

const OPCIONES_DIA = [
  "Prefiero entre semana",
  "Prefiero fines de semana",
  "Cualquier día está bien",
];

// Dropdown oscuro propio (los <select> nativos se ven mal en tema oscuro).
function DropdownOscuro({ value, onChange, opciones, placeholder }) {
  const [abierto, setAbierto] = useState(false);
  const actual = opciones.find((o) => o.value === value);
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [abierto]);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        className="w-full flex items-center justify-between gap-2 py-2 px-3 text-sm"
        style={{
          color: "#f4efe6",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(198,161,91,0.30)",
          borderRadius: 2,
        }}
      >
        <span className="truncate">{actual ? actual.label : placeholder}</span>
        <span style={{ color: ORO }}>▾</span>
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setAbierto(false)} />
          <div
            className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto"
            style={{ background: "#151316", border: `1px solid ${ORO}`, borderRadius: 2 }}
          >
            {opciones.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setAbierto(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/10"
                style={{ color: o.value === value ? ORO : "#e8e4dc" }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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
  "El costo de la sesión se paga al final de la sesión, junto con tu inversión en decants, y no es reembolsable ni redimible.",
  "La inversión en decants se acuerda al agendar y se paga al final de la sesión; el crédito no usado no se reembolsa y queda como saldo en tienda.",
  "Solo participan los asistentes registrados. Personas adicionales se cobran según la tarifa vigente.",
  "La fecha y el horario se confirman por WhatsApp, sujetos a disponibilidad de ambas partes. Para reagendar, avisa con al menos 24 horas de anticipación.",
  "Para cuidar el olfato de todos, se recomienda un espacio ventilado pero sin corrientes de aire fuertes, libre de humo, comida con olores intensos o velas encendidas.",
  "El cliente garantiza un acceso seguro al lugar y la presencia de un adulto responsable durante toda la sesión. Niños y mascotas quedan bajo su responsabilidad, incluidos los daños que pudieran ocasionar.",
];

// Tarjeta de perfume memorizada: solo se re-dibuja la que cambia,
// no las 142 en cada clic (antes se sentía lento y sin respuesta).
const TarjetaPerfume = memo(function TarjetaPerfume({ p, sel, bloqueado, onToggle }) {
  return (
    <div
      onClick={() => !bloqueado && onToggle(p.nombre)}
      className={`flex items-center gap-3 p-2 transition-colors w-full ${
        bloqueado ? "opacity-30" : "cursor-pointer"
      }`}
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
        decoding="async"
        width={48}
        height={48}
        className="w-12 h-12 object-cover rounded-sm shrink-0"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate" style={{ color: "#f4efe6" }}>{p.nombre}</p>
        <p className="text-xs text-gray-400 truncate">{p.casa}</p>
        <p className="text-xs" style={{ color: ORO }}>
          {fmt(p.precio)}{!p.stock ? "/ml" : ""}
        </p>
        {p.fraganticaLink && (
          <a
            href={p.fraganticaLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-block mt-1.5 text-[11px] uppercase tracking-wider px-2.5 py-1.5 rounded-sm"
            style={{ color: ORO, border: "1px solid rgba(198,161,91,0.4)" }}
          >
            + info
          </a>
        )}
      </div>
      {sel && <span className="text-lg shrink-0" style={{ color: ORO }}>✓</span>}
    </div>
  );
});

const VEREDICTOS = [
  { value: "gusto", label: "Me gustó" },
  { value: "tal_vez", label: "Tal vez" },
  { value: "no", label: "No" },
];

// Detalle de una sesión: notas + veredicto por perfume (autoguardado)
// y pedido final con cualquier decant del catálogo.
function DetalleSesion({ sesionData, username, nombre, parfums, porPerfume, cfg = CFG_DEFAULT, minSiempre = 0, onVolver, onActualizado }) {
  const perfumesInteres = Array.isArray(sesionData.perfumes) ? sesionData.perfumes : [];
  const esPendiente = sesionData.estado !== "realizada";
  // Nunca por debajo de lo que ya eligió: si sube el precio por perfume en la
  // config, la sesión no queda bloqueada.
  const maxSel = Math.max(
    Math.floor(creditoSesion(sesionData) / (Number(porPerfume) || 1000)),
    perfumesInteres.length,
  );
  const [editando, setEditando] = useState(false);
  const [seleccion, setSeleccion] = useState(perfumesInteres);
  const [busqEdit, setBusqEdit] = useState("");
  const [guardandoSel, setGuardandoSel] = useState(false);
  const [msgSel, setMsgSel] = useState("");
  const [notaAbierta, setNotaAbierta] = useState({});

  const imagenDe = (perf) => parfums.find((x) => x.nombre === perf)?.image;

  const sugerenciasEdit = useMemo(() => {
    const q = busqEdit.trim().toLowerCase();
    if (!q) return [];
    return parfums
      .filter(
        (x) =>
          x.disponible !== "Agotado" &&
          !seleccion.includes(x.nombre) &&
          (x.nombre?.toLowerCase().includes(q) || x.casa?.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [busqEdit, parfums, seleccion]);

  const empezarEdicion = () => {
    setSeleccion(perfumesInteres);
    setBusqEdit("");
    setMsgSel("");
    setEditando(true);
  };

  const guardarSeleccion = async () => {
    if (seleccion.length < 1) {
      setMsgSel("Elige al menos un perfume.");
      return;
    }
    if (seleccion.length > maxSel) {
      setMsgSel(`Tu inversión te permite hasta ${maxSel} perfumes.`);
      return;
    }
    setGuardandoSel(true);
    setMsgSel("");
    try {
      const { error } = await supabase.rpc("vip_actualizar_perfumes", {
        p_username: username,
        p_sesion_id: sesionData.id,
        p_perfumes: seleccion,
      });
      if (error) throw error;
      setEditando(false);
      onActualizado?.();
    } catch {
      setMsgSel("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setGuardandoSel(false);
    }
  };
  const [notas, setNotas] = useState(() => {
    const base = sesionData.anotaciones || {};
    if (Array.isArray(base.__extras)) return base;
    // Decants agregados aparte (fuera de la lista de interés). Si ya había un
    // pedido enviado antes, se recuperan de ahí.
    const previos = Array.isArray(sesionData.pedido_final) ? sesionData.pedido_final : [];
    return {
      ...base,
      __extras: previos
        .filter((l) => !perfumesInteres.includes(l.nombre))
        .map(({ id, nombre: n, casa, ml }) => ({ id, nombre: n, casa, ml })),
    };
  });
  const [estadoGuardado, setEstadoGuardado] = useState("");
  const [busq, setBusq] = useState("");
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [msgPedido, setMsgPedido] = useState("");
  const primeraCarga = useRef(true);
  const pendiente = useRef(null);

  // Autoguardado de notas, ml y extras (espera a que deje de escribir).
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    pendiente.current = notas;
    setEstadoGuardado("Guardando…");
    const t = setTimeout(async () => {
      pendiente.current = null;
      try {
        const { error } = await supabase.rpc("vip_guardar_anotaciones", {
          p_username: username,
          p_sesion_id: sesionData.id,
          p_anotaciones: notas,
        });
        setEstadoGuardado(error ? "No se pudo guardar" : "Guardado ✓");
        if (!error) onActualizado?.();
      } catch {
        setEstadoGuardado("No se pudo guardar");
      }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notas]);

  // Si sale de la sesión antes de que corra el autoguardado, guarda lo pendiente.
  useEffect(
    () => () => {
      if (!pendiente.current) return;
      supabase
        .rpc("vip_guardar_anotaciones", {
          p_username: username,
          p_sesion_id: sesionData.id,
          p_anotaciones: pendiente.current,
        })
        .then(({ error }) => !error && onActualizado?.());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const setNota = (perf, campo, val) =>
    setNotas((prev) => ({ ...prev, [perf]: { ...(prev[perf] || {}), [campo]: val } }));

  // Cambiar veredicto: "No" (o desmarcar) borra los ml; al cambiar, la
  // inclusión vuelve a su valor por defecto (Me gustó = incluido).
  const setVeredicto = (perf, v) =>
    setNotas((prev) => {
      const n = prev[perf] || {};
      const nuevo = n.veredicto === v ? "" : v;
      const conMl = nuevo === "gusto" || nuevo === "tal_vez";
      const { incluir, ...resto } = n;
      return { ...prev, [perf]: { ...resto, veredicto: nuevo, ml: conMl ? n.ml || "" : "" } };
    });

  const parfumPorId = (id) => parfums.find((x) => x.id === id);
  const parfumPorNombre = (nom) => parfums.find((x) => x.nombre === nom);

  // ¿Se puede pedir en decant?
  const motivoNoDecant = (x) => {
    if (!x) return "No disponible";
    if (x.stock === true) return "Solo en botella";
    if (x.disponible === "Agotado") return "Agotado";
    return null;
  };

  // Líneas del pedido que vienen de las notas (Me gustó / Tal vez con ml).
  const lineasNotas = useMemo(
    () =>
      perfumesInteres
        .map((perf) => {
          const n = notas[perf] || {};
          const x = parfumPorNombre(perf);
          const ml = Number(n.ml);
          if (!(n.veredicto === "gusto" || n.veredicto === "tal_vez")) return null;
          if (!ml || motivoNoDecant(x)) return null;
          return {
            key: perf,
            id: x.id,
            nombre: perf,
            casa: x.casa,
            ml,
            monto: calcularPrecioDecant(x, ml),
            veredicto: n.veredicto,
            incluido: n.incluir ?? n.veredicto === "gusto",
          };
        })
        .filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [perfumesInteres, notas, parfums],
  );

  const extras = Array.isArray(notas.__extras) ? notas.__extras : [];
  // Todo decant extra se cobra, aunque el perfume se haya marcado Agotado o
  // Solo en botella en la tienda después de agregarlo (en la sesión sí se
  // entregó). Solo si el perfume ya no existe no hay precio: se avisa.
  const lineasExtras = extras.map((e) => {
    const x = parfumPorId(e.id);
    const ml = Number(e.ml) || 0;
    const sinPrecio = parfums.length > 0 && !x;
    return { ...e, ml, sinPrecio, monto: x ? calcularPrecioDecant(x, ml) : 0 };
  });
  const setExtras = (fn) =>
    setNotas((prev) => ({ ...prev, __extras: fn(Array.isArray(prev.__extras) ? prev.__extras : []) }));

  const decantsCatalogo = useMemo(
    () =>
      parfums
        .filter((x) => !motivoNoDecant(x))
        .sort(
          (a, b) =>
            (a.casa || "").localeCompare(b.casa || "", "es") ||
            (a.nombre || "").localeCompare(b.nombre || "", "es"),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parfums],
  );
  const sugerencias = useMemo(() => {
    const q = busq.trim().toLowerCase();
    if (!q) return [];
    return decantsCatalogo
      .filter(
        (x) =>
          !perfumesInteres.includes(x.nombre) &&
          !extras.some((e) => e.id === x.id) &&
          (x.nombre?.toLowerCase().includes(q) || x.casa?.toLowerCase().includes(q)),
      )
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busq, decantsCatalogo, perfumesInteres, notas]);

  const agregarExtra = (x) => {
    const ml = getOpcionesMililitros(x, { minSiempre })[0]?.value || 1;
    setExtras((prev) => [...prev, { id: x.id, nombre: x.nombre, casa: x.casa, ml }]);
    setBusq("");
    setMsgPedido("");
  };
  const cambiarMlExtra = (id, ml) =>
    setExtras((prev) => prev.map((e) => (e.id === id ? { ...e, ml: Number(ml) } : e)));
  const quitarExtra = (id) => setExtras((prev) => prev.filter((e) => e.id !== id));

  const incluidas = lineasNotas.filter((l) => l.incluido);
  const totalPedido =
    incluidas.reduce((acc, l) => acc + l.monto, 0) +
    lineasExtras.reduce((acc, l) => acc + l.monto, 0);
  const credito = creditoSesion(sesionData);
  const diferencia = totalPedido - credito;
  // Se cobra todo al final: lo mayor entre el pedido y la inversión (lo no
  // usado queda como saldo) + el costo de la sesión (no redimible).
  const costoSesion = costoSesionPara(sesionData.num_personas, cfg);
  const totalAPagar = Math.max(totalPedido, credito) + costoSesion;
  const porcentaje = credito > 0 ? Math.min(100, (totalPedido / credito) * 100) : 0;

  const enviarPedido = async () => {
    const pedidoLimpio = [...incluidas, ...lineasExtras]
      .filter((l) => l.ml > 0)
      .map(({ id, nombre: n, casa, ml, monto }) => ({ id, nombre: n, casa, ml, monto }));
    if (pedidoLimpio.length === 0 || enviandoPedido) return;
    // WhatsApp se abre antes del await: iPhone bloquea ventanas que se abren
    // después de esperar una respuesta del servidor.
    const lineas = [
      "Hola Diego, este es mi pedido final de la Experiencia Privada.",
      "",
      `Cliente: ${nombre || "-"}`,
      `Sesión: ${fechaSesionTexto(sesionData) || "solicitada el " + new Date(sesionData.creado_en).toLocaleDateString("es-MX")}`,
      "",
      ...pedidoLimpio.map((l) => `• ${l.nombre} (${l.casa}) · ${l.ml} ml — ${fmt(l.monto)}`),
      "",
      `Total del pedido: ${fmt(totalPedido)}`,
      `Inversión acordada: ${fmt(credito)}`,
      diferencia > 0
        ? `Decants arriba de la inversión: ${fmt(diferencia)}`
        : `Crédito restante (saldo en tienda): ${fmt(-diferencia)}`,
      `Costo de la sesión (no redimible, ${sesionData.num_personas || 1} ${
        Number(sesionData.num_personas) === 1 ? "persona" : "personas"
      }): ${fmt(costoSesion)}`,
      "",
      `TOTAL A PAGAR: ${fmt(totalAPagar)}`,
    ];
    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lineas.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
    setEnviandoPedido(true);
    setMsgPedido("");
    try {
      const { error } = await supabase.rpc("vip_enviar_pedido", {
        p_username: username,
        p_sesion_id: sesionData.id,
        p_pedido: pedidoLimpio,
      });
      if (error) throw error;
      onActualizado?.();
      setMsgPedido("Pedido enviado ✓");
    } catch {
      setMsgPedido(
        "Se abrió WhatsApp, pero el pedido no quedó registrado aquí. Intenta enviarlo de nuevo.",
      );
    } finally {
      setEnviandoPedido(false);
    }
  };

  const panel = {
    border: "1px solid rgba(198,161,91,0.18)",
    background: "rgba(255,255,255,0.02)",
  };
  const inputStyle = {
    color: "#f4efe6",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(198,161,91,0.30)",
    borderRadius: 2,
  };
  const divisor = (
    <div
      className="my-10 h-px"
      style={{ background: "linear-gradient(90deg, transparent, rgba(198,161,91,0.5), transparent)" }}
    />
  );

  return (
    <div>
      <button
        onClick={onVolver}
        className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-200 mb-6"
      >
        ← Volver a mis sesiones
      </button>

      <h2 className="text-3xl sm:text-4xl" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
        {fechaSesionTexto(sesionData) ? (
          <span className="capitalize">{fechaSesionTexto(sesionData)}</span>
        ) : (
          "Fecha por confirmar"
        )}
      </h2>
      <div className="text-sm text-gray-400 mt-3 space-y-1">
        <p>
          {sesionData.num_personas} {sesionData.num_personas === 1 ? "persona" : "personas"}
        </p>
        <p>
          Inversión acordada: <span style={{ color: ORO }}>{fmt(credito)}</span>
        </p>
        <p>
          Costo de la sesión: <span style={{ color: ORO }}>{fmt(costoSesion)}</span>{" "}
          <span className="text-gray-500">(no redimible)</span>
        </p>
        {sesionData.lugar && <p>{sesionData.lugar}</p>}
      </div>
      {Array.isArray(sesionData.asistentes) && sesionData.asistentes.length > 0 && (
        <p className="text-sm text-gray-500 mt-1">
          Asistentes: {sesionData.asistentes.join(", ")}
        </p>
      )}

      {divisor}

      {/* Notas por perfume */}
      <section className="rounded-md p-5 sm:p-6" style={panel}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-2xl" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
            Tus perfumes y notas
          </h3>
          {estadoGuardado && <span className="text-xs text-gray-500">{estadoGuardado}</span>}
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Marca qué te pareció cada perfume y, si te gustó, cuántos ml quieres. Se guarda solo.
        </p>

        {credito > 0 && (
          <div
            className="sticky top-0 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 mb-5"
            style={{ background: "#0f0e10", borderBottom: "1px solid rgba(198,161,91,0.25)" }}
          >
            <p className="text-sm text-gray-300">
              Llevas <strong style={{ color: ORO }}>{fmt(totalPedido)}</strong> de {fmt(credito)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: diferencia > 0 ? "#ff8a8a" : "#9ca3af" }}>
              {diferencia > 0 ? `Te pasas por ${fmt(diferencia)}` : `Te quedan ${fmt(-diferencia)}`}
            </p>
            <div className="mt-2 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${porcentaje}%`, background: diferencia > 0 ? "#ff8a8a" : ORO }}
              />
            </div>
          </div>
        )}

        {/* Editar perfumes (solo pendiente) */}
        {esPendiente && !editando && (
          <button
            onClick={empezarEdicion}
            className="w-full mb-4 text-xs uppercase tracking-widest px-3 py-3 rounded-sm"
            style={{ color: ORO, border: "1px solid rgba(198,161,91,0.5)" }}
          >
            Editar perfumes ({perfumesInteres.length} / {maxSel})
          </button>
        )}

        {editando && (
          <div
            className="mb-5 p-4 rounded-sm"
            style={{ border: `1px solid ${ORO}`, background: "rgba(198,161,91,0.06)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: "#f4efe6" }}>Editar perfumes de la sesión</p>
              <span className="text-sm" style={{ color: ORO }}>
                {seleccion.length} / {maxSel}
              </span>
            </div>
            <input
              type="text"
              value={busqEdit}
              onChange={(e) => setBusqEdit(e.target.value)}
              placeholder="Busca un perfume o casa para agregar…"
              className="w-full py-2 px-3 text-sm outline-none"
              style={inputStyle}
            />
            {busqEdit.trim() && (
              <div className="mt-1" style={{ border: "1px solid rgba(198,161,91,0.2)", borderRadius: 2 }}>
                {sugerenciasEdit.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">Sin resultados.</p>
                ) : (
                  sugerenciasEdit.map((x) => {
                    const lleno = seleccion.length >= maxSel;
                    return (
                      <button
                        key={x.id}
                        disabled={lleno}
                        onClick={() => {
                          setSeleccion((prev) => [...prev, x.nombre]);
                          setBusqEdit("");
                        }}
                        className="w-full flex items-center gap-3 text-left px-3 py-3 text-sm hover:bg-white/5 disabled:opacity-30"
                        style={{ color: "#e8e4dc" }}
                      >
                        <img
                          src={imagenThumb(x.image, 80)}
                          alt=""
                          loading="lazy"
                          className="w-8 h-8 object-cover rounded-sm shrink-0"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        />
                        <span className="truncate">
                          {x.nombre} <span className="text-gray-500">· {x.casa}</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {seleccion.map((perf) => (
                <span
                  key={perf}
                  className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-sm"
                  style={{ background: "rgba(198,161,91,0.15)", color: "#f4efe6", border: `1px solid ${ORO}` }}
                >
                  {perf}
                  <button
                    onClick={() => setSeleccion((prev) => prev.filter((x) => x !== perf))}
                    style={{ color: ORO }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={guardarSeleccion}
                disabled={guardandoSel}
                className="w-full py-3 text-sm uppercase tracking-widest disabled:opacity-40"
                style={{ background: ORO, color: "#0b0b0d", borderRadius: 2, fontWeight: 600 }}
              >
                {guardandoSel ? "Guardando…" : "Guardar cambios"}
              </button>
              <button
                onClick={() => setEditando(false)}
                className="w-full py-3 text-sm text-gray-400 hover:text-gray-200"
              >
                Cancelar
              </button>
            </div>
            {msgSel && <p className="text-sm mt-3" style={{ color: "#d98c8c" }}>{msgSel}</p>}
          </div>
        )}

        {perfumesInteres.length === 0 ? (
          <p className="text-sm text-gray-500">Esta sesión no tiene perfumes registrados.</p>
        ) : (
          <div className="space-y-3">
            {perfumesInteres.map((perf) => {
              const n = notas[perf] || {};
              const img = imagenDe(perf);
              const abierta = notaAbierta[perf] ?? Boolean(n.nota);
              return (
                <div
                  key={perf}
                  className="p-3 rounded-sm"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {img ? (
                      <img
                        src={imagenThumb(img, 96)}
                        alt={perf}
                        loading="lazy"
                        decoding="async"
                        className="w-10 h-10 object-cover rounded-sm shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-sm shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      />
                    )}
                    <p className="text-sm" style={{ color: "#f4efe6" }}>{perf}</p>
                  </div>
                  <div className="flex gap-2 mb-2">
                    {VEREDICTOS.map((v) => (
                      <button
                        key={v.value}
                        onClick={() => setVeredicto(perf, v.value)}
                        className="flex-1 py-3 text-sm"
                        style={
                          n.veredicto === v.value
                            ? { background: ORO, color: "#0b0b0d", borderRadius: 2, fontWeight: 600 }
                            : { ...inputStyle, color: "#e8e4dc" }
                        }
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  {(n.veredicto === "gusto" || n.veredicto === "tal_vez") &&
                    (() => {
                      const x = parfumPorNombre(perf);
                      const motivo = motivoNoDecant(x);
                      if (motivo) {
                        return <p className="text-xs text-gray-500 mb-2">{motivo} · no aplica para decant</p>;
                      }
                      const opciones = getOpcionesMililitros(x, { minSiempre });
                      const ml = Number(n.ml) || 0;
                      return (
                        <div className="mb-3">
                          <select
                            value={n.ml || ""}
                            onChange={(e) => setNota(perf, "ml", e.target.value)}
                            className="w-full py-3 px-3"
                            style={{ ...inputStyle, background: "#151316" }}
                          >
                            <option value="" style={{ background: "#151316", color: "#f4efe6" }}>
                              ¿Cuántos ml?
                            </option>
                            {opciones.map((o) => (
                              <option key={o.value} value={o.value} style={{ background: "#151316", color: "#f4efe6" }}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          {ml > 0 && (
                            <p className="text-sm mt-1.5" style={{ color: ORO }}>
                              {fmt(calcularPrecioDecant(x, ml))}
                              {n.veredicto === "tal_vez" && !n.incluir && (
                                <span className="text-xs text-gray-500"> · no incluido aún</span>
                              )}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  <button
                    onClick={() => setNotaAbierta((prev) => ({ ...prev, [perf]: !abierta }))}
                    className="text-xs uppercase tracking-widest py-2"
                    style={{ color: ORO }}
                  >
                    {abierta ? "▴ Ocultar nota" : n.nota ? "▾ Ver nota" : "+ Agregar nota"}
                  </button>
                  {abierta && (
                    <textarea
                      rows={2}
                      value={n.nota || ""}
                      onChange={(e) => setNota(perf, "nota", e.target.value)}
                      placeholder="¿Qué te pareció?"
                      className="w-full mt-2 py-2 px-3 text-sm outline-none resize-none"
                      style={inputStyle}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {divisor}

      {/* Revisa tu pedido */}
      <section className="rounded-md p-5 sm:p-6" style={panel}>
        <h3 className="text-2xl mb-1" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
          Revisa tu pedido
        </h3>
        <p className="text-sm text-gray-400 mb-5">
          Se arma con los perfumes a los que les pusiste ml. Los de "Me gustó" entran solos;
          los de "Tal vez" márcalos si los quieres. Los ml se ajustan en la nota de cada perfume.
          {sesionData.pedido_enviado ? " Ya enviaste un pedido; si lo cambias, vuelve a enviarlo." : ""}
        </p>

        {lineasNotas.length === 0 && lineasExtras.length === 0 && (
          <p className="text-sm text-gray-500 mb-4">
            Aún no hay decants. Marca "Me gustó" o "Tal vez" en un perfume y elige sus ml.
          </p>
        )}

        {lineasNotas.length > 0 && (
          <div className="space-y-2">
            {lineasNotas.map((l) => (
              <label
                key={l.key}
                className="flex items-start gap-3 p-3 rounded-sm cursor-pointer"
                style={{
                  border: l.incluido ? `1px solid ${ORO}` : "1px solid rgba(255,255,255,0.08)",
                  opacity: l.incluido ? 1 : 0.6,
                }}
              >
                <input
                  type="checkbox"
                  checked={l.incluido}
                  onChange={() => setNota(l.key, "incluir", !l.incluido)}
                  className="w-5 h-5 mt-0.5 accent-[#C6A15B] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm" style={{ color: "#f4efe6" }}>{l.nombre}</p>
                  <p className="text-xs text-gray-500">{l.casa}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {l.veredicto === "gusto" ? "Me gustó" : "Tal vez"} · {l.ml} ml ·{" "}
                    <span style={{ color: ORO }}>{fmt(l.monto)}</span>
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Decants extra (fuera de la lista) */}
        <p className="text-xs uppercase tracking-widest text-gray-400 mt-6 mb-2">
          Agregar otro decant
        </p>
        <input
          type="text"
          value={busq}
          onChange={(e) => setBusq(e.target.value)}
          placeholder="Busca un perfume o casa…"
          className="w-full py-2.5 px-3 text-sm outline-none"
          style={inputStyle}
        />
        {busq.trim() && (
          <div className="mt-1" style={{ border: "1px solid rgba(198,161,91,0.2)", borderRadius: 2 }}>
            {sugerencias.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500">Sin resultados.</p>
            ) : (
              sugerencias.map((x) => (
                <button
                  key={x.id}
                  onClick={() => agregarExtra(x)}
                  className="w-full text-left px-3 py-3 text-sm hover:bg-white/5"
                  style={{ color: "#e8e4dc", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <span className="block">{x.nombre}</span>
                  <span className="block text-xs text-gray-500">
                    {x.casa} · <span style={{ color: ORO }}>{fmt(x.precio)}/ml</span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {lineasExtras.length > 0 && (
          <div className="mt-3 space-y-2">
            {lineasExtras.map((l) => {
              const x = parfumPorId(l.id);
              const opciones = x
                ? getOpcionesMililitros(x, { minSiempre })
                : [{ value: l.ml, label: `${l.ml} ml` }];
              return (
                <div
                  key={l.id}
                  className="p-3 rounded-sm"
                  style={{ border: `1px solid ${ORO}` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm" style={{ color: "#f4efe6" }}>{l.nombre}</p>
                      <p className="text-xs text-gray-500">{l.casa} · extra</p>
                      {l.sinPrecio && (
                        <p className="text-xs mt-0.5" style={{ color: "#d98c8c" }}>
                          Ya no está en el catálogo · Diego te confirma el precio
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => quitarExtra(l.id)}
                      className="text-gray-500 hover:text-red-400 text-xl leading-none px-2"
                      title="Quitar"
                    >
                      ×
                    </button>
                  </div>
                  <select
                    value={l.ml}
                    onChange={(e) => cambiarMlExtra(l.id, e.target.value)}
                    className="w-full py-3 px-3"
                    style={{ ...inputStyle, background: "#151316" }}
                  >
                    {opciones.map((o) => (
                      <option key={o.value} value={o.value} style={{ background: "#151316", color: "#f4efe6" }}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm mt-1.5" style={{ color: ORO }}>{fmt(l.monto)}</p>
                </div>
              );
            })}
          </div>
        )}

        {totalPedido > 0 && (
          <div
            className="mt-5 rounded-sm px-5 py-4"
            style={{ background: "rgba(198,161,91,0.10)", border: `1px solid ${ORO}` }}
          >
            <div className="flex justify-between text-sm text-gray-300">
              <span>Total del pedido</span>
              <span>{fmt(totalPedido)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300 mt-1">
              <span>Inversión acordada</span>
              <span>{fmt(credito)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300 mt-1">
              <span>{diferencia > 0 ? "Decants arriba de tu inversión" : "Crédito restante (saldo)"}</span>
              <span>{fmt(Math.abs(diferencia))}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300 mt-1">
              <span>Costo de la sesión (no redimible)</span>
              <span>{fmt(costoSesion)}</span>
            </div>
            <div
              className="flex justify-between items-baseline mt-3 pt-3"
              style={{ borderTop: "1px solid rgba(198,161,91,0.3)" }}
            >
              <span className="uppercase text-xs tracking-widest" style={{ color: ORO }}>
                Total a pagar
              </span>
              <span className="text-2xl" style={{ fontFamily: SERIF, color: ORO }}>
                {fmt(totalAPagar)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {diferencia < 0
                ? "Pagas tu inversión completa + la sesión. El crédito restante queda como saldo en tienda para futuros decants."
                : "Tu pedido + el costo de la sesión."}
            </p>
          </div>
        )}

        <button
          onClick={enviarPedido}
          disabled={totalPedido <= 0 || enviandoPedido}
          className="w-full mt-6 py-3.5 uppercase tracking-[0.2em] text-sm disabled:opacity-40"
          style={{ background: ORO, color: "#0b0b0d", borderRadius: 2, fontWeight: 600 }}
        >
          {enviandoPedido ? "Enviando…" : "Enviar pedido final"}
        </button>
        {msgPedido && <p className="text-sm text-center mt-3" style={{ color: ORO }}>{msgPedido}</p>}
      </section>
    </div>
  );
}

export default function ExperienciaPrivada() {
  useVipHead();
  const [sesion, setSesion] = useState(null);
  const [username, setUsername] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState("");
  const [cfg, setCfg] = useState(CFG_DEFAULT);
  const { parfums = [], minDecantSiempre = 0 } = useParfums() || {};

  // El borrador se lee al crear el estado (no en un efecto), así el efecto que
  // lo guarda nunca lo sobrescribe antes de recuperarlo.
  const [borrador] = useState(leerBorrador);
  const [numPersonas, setNumPersonas] = useState(() =>
    Math.max(1, Number(borrador.numPersonas) || 1),
  );
  const [asistentes, setAsistentes] = useState(() =>
    ajustarAsistentes(borrador.asistentes || [""], Math.max(1, Number(borrador.numPersonas) || 1)),
  );
  const [perfumesSel, setPerfumesSel] = useState(() =>
    Array.isArray(borrador.perfumesSel) ? borrador.perfumesSel : [],
  );
  const [busqueda, setBusqueda] = useState("");
  const [casaFiltro, setCasaFiltro] = useState("");
  const [orden, setOrden] = useState("casa");
  const [dia, setDia] = useState(borrador.dia || "");
  const [preferencia, setPreferencia] = useState(borrador.preferencia || "");
  const [lugar, setLugar] = useState(borrador.lugar || "");
  const [aceptaTyc, setAceptaTyc] = useState(Boolean(borrador.aceptaTyc));
  const [monto, setMonto] = useState(borrador.monto != null ? String(borrador.monto) : "");
  const [nombre, setNombre] = useState(borrador.nombre || "");
  const [sesiones, setSesiones] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [sesionAbiertaId, setSesionAbiertaId] = useState(null);
  const [msgAgenda, setMsgAgenda] = useState(null);

  const cargarSesiones = async (u) => {
    const user = (u || sesion?.username || "").trim();
    if (!user) return;
    try {
      const { data } = await supabase.rpc("vip_sesiones", { p_username: user });
      setSesiones(Array.isArray(data) ? data : []);
    } catch {
      setSesiones([]);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_VIP);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.username) {
          setSesion(d);
          setNombre(d.nombre || "");
          setAsistentes((prev) => (prev[0]?.trim() ? prev : [d.nombre || "", ...prev.slice(1)]));
          cargarSesiones(d.username);
          // Revalida la clave para traer saldo y nombre al día (o sacar al
          // cliente si ya no existe). Sin conexión, se queda con lo guardado.
          supabase
            .rpc("validar_vip", { p_username: d.username })
            .then(({ data, error: rpcError }) => {
              if (rpcError) return;
              const cliente = Array.isArray(data) ? data[0] : data;
              if (!cliente?.nombre) {
                salir();
                return;
              }
              const fresca = {
                username: d.username,
                nombre: cliente.nombre,
                saldo: Number(cliente.saldo) || 0,
              };
              localStorage.setItem(LS_VIP, JSON.stringify(fresca));
              setSesion(fresca);
              setNombre(fresca.nombre);
            });
        }
      }
    } catch {
      // ignora datos corruptos
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Al empezar una nueva solicitud, se quita el aviso de la anterior.
  useEffect(() => {
    if (monto) setMsgAgenda(null);
  }, [monto]);

  // Cambia el número de personas y ajusta la lista de asistentes en el mismo paso.
  const cambiarPersonas = (delta) => {
    const n = Math.max(1, (Number(numPersonas) || 1) + delta);
    setNumPersonas(n);
    setAsistentes((prev) => ajustarAsistentes(prev, n));
  };

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
        setAsistentes((prev) =>
          ajustarAsistentes([nueva.nombre, ...prev.slice(1)], Math.max(1, Number(numPersonas) || 1)),
        );
        cargarSesiones(nueva.username);
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
    setSesiones([]);
    setSesionAbiertaId(null);
    setUsername("");
    setMsgAgenda(null);
  };

  const costoSesion = useMemo(() => costoSesionPara(numPersonas, cfg), [numPersonas, cfg]);

  const montoNum = Number(monto) || 0;
  const montoValido = montoNum >= Number(cfg.inversion_min);
  const maxPerfumes = Math.floor(
    montoNum / (Number(cfg.inversion_por_perfume) || 1000),
  );

  // Para oler solo se ofrecen perfumes con frasco disponible.
  const catalogoOler = useMemo(
    () => parfums.filter((p) => p.disponible !== "Agotado"),
    [parfums],
  );

  const casas = useMemo(
    () =>
      [...new Set(catalogoOler.map((p) => p.casa).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [catalogoOler],
  );

  const listaFiltrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    let lista = catalogoOler.filter((p) => {
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
  }, [catalogoOler, busqueda, casaFiltro, orden]);

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
  const togglePerfume = useCallback(
    (nombrePerf) => {
      setPerfumesSel((prev) => {
        if (prev.includes(nombrePerf)) return prev.filter((x) => x !== nombrePerf);
        if (prev.length >= maxPerfumes) return prev; // no pasar del límite
        return [...prev, nombrePerf];
      });
    },
    [maxPerfumes],
  );

  const setAsistente = (i, val) =>
    setAsistentes((prev) => prev.map((a, idx) => (idx === i ? val : a)));

  const excedente = Math.max(0, perfumesSel.length - maxPerfumes);
  const puedeEnviar =
    montoValido &&
    perfumesSel.length >= 1 &&
    excedente === 0 &&
    nombre.trim() &&
    lugar.trim() &&
    aceptaTyc;

  const enviar = async () => {
    if (!puedeEnviar || enviando) return;
    const nombres = asistentes.map((a) => a.trim()).filter(Boolean);

    // WhatsApp se abre antes del await: iPhone bloquea ventanas que se abren
    // después de esperar una respuesta del servidor.
    const lineas = [
      "Hola Diego, quiero agendar una Experiencia Privada.",
      "",
      `Cliente: ${nombre || "-"}`,
      `Personas: ${numPersonas}`,
      `Asistentes: ${nombres.length ? nombres.join(", ") : "por definir"}`,
      `Costo de sesión (no redimible): ${fmt(costoSesion)}`,
      `Inversión en decants (redimible): ${fmt(montoNum)}`,
      `TOTAL mínimo a pagar al final de la sesión: ${fmt(costoSesion + montoNum)}`,
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

    // Crea la sesión pendiente (para que el cliente la vea en su espacio).
    setEnviando(true);
    setMsgAgenda(null);
    try {
      const { error: rpcError } = await supabase.rpc("vip_agendar", {
        p_username: sesion.username,
        p_num_personas: Number(numPersonas) || 1,
        p_perfumes: perfumesSel,
        p_inversion: montoNum,
        p_preferencia: preferencia || null,
        p_lugar: lugar.trim() || null,
        p_dia: dia || null,
        p_asistentes: nombres,
      });
      if (rpcError) throw rpcError;
      await cargarSesiones(sesion.username);
      // Limpia el formulario: evita agendar la misma sesión dos veces.
      setNumPersonas(1);
      setAsistentes([nombre]);
      setMonto("");
      setPerfumesSel([]);
      setDia("");
      setPreferencia("");
      setLugar("");
      setAceptaTyc(false);
      setMsgAgenda({
        ok: true,
        texto: "Solicitud enviada ✓ Ya aparece en «Mis sesiones». Te confirmo la fecha por WhatsApp.",
      });
    } catch {
      setMsgAgenda({
        ok: false,
        texto:
          "Se abrió WhatsApp, pero la sesión no quedó guardada en tu espacio. Intenta de nuevo en un momento.",
      });
    } finally {
      setEnviando(false);
    }
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
      <div data-vip style={fondo} className="flex items-center justify-center px-6">
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
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
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

  const tarjetaPerfume = (p) => (
    <TarjetaPerfume
      key={p.id}
      p={p}
      sel={perfumesSel.includes(p.nombre)}
      bloqueado={!perfumesSel.includes(p.nombre) && perfumesSel.length >= maxPerfumes}
      onToggle={togglePerfume}
    />
  );

  const sesionAbierta = sesiones.find((x) => x.id === sesionAbiertaId);
  if (sesionAbierta) {
    return (
      <div data-vip style={fondo}>
        <div className="max-w-2xl mx-auto w-full px-6 py-16">
          <p className="uppercase text-xs tracking-[0.35em] mb-5" style={{ color: ORO }}>
            Experiencia privada
          </p>
          <DetalleSesion
            key={sesionAbierta.id}
            sesionData={sesionAbierta}
            username={sesion.username}
            nombre={nombre}
            parfums={parfums}
            porPerfume={cfg.inversion_por_perfume}
            cfg={cfg}
            minSiempre={minDecantSiempre}
            onVolver={() => setSesionAbiertaId(null)}
            onActualizado={() => cargarSesiones(sesion.username)}
          />
        </div>
      </div>
    );
  }

  return (
    <div data-vip style={fondo}>
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

        {/* Mis sesiones */}
        {sesiones.length > 0 && (
          <>
            <div className="my-12 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(198,161,91,0.5), transparent)" }} />
            <section className="rounded-md p-5 sm:p-6" style={{ border: "1px solid rgba(198,161,91,0.18)", background: "rgba(255,255,255,0.02)" }}>
              <h2 className="text-2xl sm:text-3xl mt-0 mb-4" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
                Mis sesiones
              </h2>
              <div className="space-y-2">
                {sesiones.map((s) => {
                  const realizada = s.estado === "realizada";
                  const nPerfumes = Array.isArray(s.perfumes) ? s.perfumes.length : 0;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSesionAbiertaId(s.id);
                        window.scrollTo(0, 0);
                      }}
                      className="w-full text-left block p-4 rounded-sm hover:bg-white/5"
                      style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
                    >
                      <div>
                        <span
                            className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={
                              realizada
                                ? { background: "rgba(255,255,255,0.08)", color: "#aaa" }
                                : { background: "rgba(198,161,91,0.15)", color: ORO }
                            }
                          >
                            {realizada ? "Realizada" : "Próxima"}
                          </span>
                        <p className="text-base text-gray-200 capitalize mt-2">
                          {fechaSesionTexto(s) || "Fecha por confirmar"}
                        </p>
                        {!fechaSesionTexto(s) && (
                          <p className="text-xs text-gray-500">
                            Solicitada el {new Date(s.creado_en).toLocaleDateString("es-MX")}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {s.num_personas} {s.num_personas === 1 ? "persona" : "personas"}
                        </p>
                        <p className="text-xs text-gray-500">{nPerfumes} perfumes de interés</p>
                        {s.pedido_enviado && (
                          <p className="text-xs mt-0.5" style={{ color: ORO }}>Pedido enviado</p>
                        )}
                      </div>
                      <span className="block text-xs uppercase tracking-widest mt-3" style={{ color: ORO }}>
                        Abrir sesión →
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Abre una sesión para anotar cada perfume y hacer tu pedido final.
              </p>
            </section>
          </>
        )}

        <div className="my-12 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(198,161,91,0.5), transparent)" }} />

        <section className="rounded-md p-5 sm:p-6" style={{ border: "1px solid rgba(198,161,91,0.18)", background: "rgba(255,255,255,0.02)" }}>
        <h2 className="text-2xl sm:text-3xl mt-0 mb-2" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
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

        </section>

        <div className="my-12 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(198,161,91,0.5), transparent)" }} />

        <section className="rounded-md p-5 sm:p-6" style={{ border: "1px solid rgba(198,161,91,0.18)", background: "rgba(255,255,255,0.02)" }}>
        <h2 className="text-2xl sm:text-3xl mt-0 mb-6" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
          Agenda tu sesión
        </h2>

        {/* Personas */}
        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Número de personas</label>
        <div className="flex items-center gap-3">
          <button onClick={() => cambiarPersonas(-1)} className="w-9 h-9 border text-lg" style={{ borderColor: "rgba(198,161,91,0.4)", color: ORO, borderRadius: 2 }}>−</button>
          <span className="text-xl w-8 text-center" style={{ color: "#f4efe6" }}>{numPersonas}</span>
          <button onClick={() => cambiarPersonas(1)} className="w-9 h-9 border text-lg" style={{ borderColor: "rgba(198,161,91,0.4)", color: ORO, borderRadius: 2 }}>+</button>
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

        {montoValido && (
          <div
            className="mt-4 rounded-sm px-5 py-4"
            style={{ background: "rgba(198,161,91,0.10)", border: `1px solid ${ORO}` }}
          >
            <div className="flex justify-between text-sm text-gray-300">
              <span>Costo de sesión ({numPersonas} {numPersonas === 1 ? "persona" : "personas"})</span>
              <span>{fmt(costoSesion)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300 mt-1">
              <span>Inversión en decants</span>
              <span>{fmt(montoNum)}</span>
            </div>
            <div
              className="flex justify-between items-baseline mt-3 pt-3"
              style={{ borderTop: "1px solid rgba(198,161,91,0.3)" }}
            >
              <span className="uppercase text-xs tracking-widest" style={{ color: ORO }}>
                Total mínimo a pagar al final
              </span>
              <span className="text-2xl" style={{ fontFamily: SERIF, color: ORO }}>
                {fmt(costoSesion + montoNum)}
              </span>
            </div>
          </div>
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
              <div className="sm:w-52">
                <DropdownOscuro
                  value={casaFiltro}
                  onChange={setCasaFiltro}
                  placeholder="Todas las casas"
                  opciones={[
                    { value: "", label: "Todas las casas" },
                    ...casas.map((c) => ({ value: c, label: c })),
                  ]}
                />
              </div>
              <div className="sm:w-52">
                <DropdownOscuro
                  value={orden}
                  onChange={setOrden}
                  placeholder="Ordenar"
                  opciones={[
                    { value: "casa", label: "Casa (A-Z)" },
                    { value: "precio_asc", label: "Precio: menor a mayor" },
                    { value: "precio_desc", label: "Precio: mayor a menor" },
                  ]}
                />
              </div>
            </div>

            {excedente > 0 && (
              <p className="text-sm mb-3" style={{ color: "#ff8a8a" }}>
                Tu inversión permite hasta {maxPerfumes} perfumes. Quita {excedente}{" "}
                {excedente === 1 ? "perfume" : "perfumes"} o sube tu inversión.
              </p>
            )}

            {/* Seleccionados */}
            {perfumesSel.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setPerfumesSel([])}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-sm mb-3"
                  style={{
                    background: "rgba(220,90,90,0.15)",
                    color: "#ff8a8a",
                    border: "1px solid rgba(220,90,90,0.6)",
                  }}
                >
                  ✕ Borrar todas ({perfumesSel.length})
                </button>
                <div className="flex flex-wrap gap-2">
                  {perfumesSel.map((p) => (
                    <span key={p} className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-sm" style={{ background: "rgba(198,161,91,0.15)", color: "#f4efe6", border: `1px solid ${ORO}` }}>
                      {p}
                      <button onClick={() => togglePerfume(p)} style={{ color: ORO }}>×</button>
                    </span>
                  ))}
                </div>
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

        </section>

        <div className="my-12 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(198,161,91,0.5), transparent)" }} />

        <section className="rounded-md p-5 sm:p-6" style={{ border: "1px solid rgba(198,161,91,0.18)", background: "rgba(255,255,255,0.02)" }}>
        {/* Términos de la experiencia */}
        <h3 className="text-xl mt-0 mb-3" style={{ fontFamily: SERIF, color: "#f4efe6" }}>
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
        </section>

        <button
          onClick={enviar}
          disabled={!puedeEnviar || enviando}
          className="w-full mt-8 py-3.5 uppercase tracking-[0.2em] text-sm disabled:opacity-40"
          style={{ background: ORO, color: "#0b0b0d", borderRadius: 2, fontWeight: 600 }}
        >
          {enviando ? "Agendando…" : "Solicitar por WhatsApp"}
        </button>
        {msgAgenda && (
          <p className="text-center text-sm mt-3" style={{ color: msgAgenda.ok ? ORO : "#d98c8c" }}>
            {msgAgenda.texto}
          </p>
        )}
        {!puedeEnviar && !msgAgenda?.ok && (
          <p className="text-center text-xs text-gray-500 mt-3">
            {excedente > 0
              ? `Quita ${excedente} ${excedente === 1 ? "perfume" : "perfumes"} de tu selección para solicitar tu sesión.`
              : "Completa tu inversión, elige mínimo 1 perfume, indica el lugar y acepta los términos para solicitar tu sesión."}
          </p>
        )}

        <button onClick={salir} className="block mx-auto mt-8 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-300">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}