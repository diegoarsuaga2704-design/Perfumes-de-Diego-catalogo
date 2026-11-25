import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import supabase from "../services/supabase";
import { Helmet } from "react-helmet-async";
import FilaDeslizable from "../ui/FilaDeslizable";
import RegaloSorpresa from "../ui/RegaloSorpresa";
import { track } from "@vercel/analytics";
import { useParfums } from "../context/ParfumsContext";
import { calcularPrecioDecant } from "../functions/pricingDecant";
import { formatPrecio } from "../functions/formatPrecio";
import { imagenThumb } from "../functions/imagenThumb";
import { normalizarTexto } from "../functions/normalizarTexto";
import { UMBRAL_ENVIO_GRATIS } from "../functions/envioGratis";
import { pedirNumeroNuevo, registrarPedidoWeb, marcarPedidoWeb } from "../functions/pedidosWeb";
import { Nieve, RamaPino, MonoRegalo, ROJO, VERDE, VERDE_OSCURO, DORADO } from "../ui/Navidad";

// Calendario de adviento. Link privado (no está en el menú, el sitemap ni en
// Google): /calendario-adviento. El cliente arma sus decants, al final elige
// calendario de 12 o 24 días (de N a 2N decants) y manda el pedido por WhatsApp.

const WHATSAPP = "5212212034647";
const SERIF = "'Cormorant Garamond', Georgia, serif";
const CREMA = "#F6EFE2";
// Rojo más oscuro para los botones (pedido de Diego).
const ROJO_BOTON = "#8A1820";
// Fondos sólidos para que la nieve quede detrás de textos y botones.
const FONDO_TARJETA = "#1B4631";
const FONDO_ELEGIDO = "#5A1C23";
const FONDO_CAMPO = "#143826";
// Campos para escribir: claros, para distinguirlos de la información.
const CAMPO = {
  background: "#FBF7EE",
  color: "#1F2A24",
  border: `2px solid ${DORADO}`,
};
// Foto de los calendarios (portada).
const FOTO_CALENDARIO = "/calendario-adviento.jpg?v=2";
// Modelos del calendario (mismo precio; se elige en el paso 2).
const MODELOS = {
  pastel: {
    nombre: "Pastel",
    foto: FOTO_CALENDARIO,
    aviso: "Llega entre el 30 de noviembre y el 4 de diciembre.",
  },
  cajas: { nombre: "Cajas navideñas", foto: "/calendario-cajitas.jpg?v=2" },
};

const CALENDARIOS = {
  12: { dias: 12, precio: 180 },
  24: { dias: 24, precio: 360 },
};
// Decants que caben: de N a 2N según el calendario. En total, de 12 a 48.
const MIN_DECANTS = Math.min(...Object.values(CALENDARIOS).map((c) => c.dias));
const MAX_DECANTS = Math.max(...Object.values(CALENDARIOS).map((c) => c.dias * 2));
const cabeEn = (c, n) => n >= c.dias && n <= c.dias * 2;
const ENVIO_REGULAR = 180;
const FECHAS_ENVIO = "entre el 30 de noviembre y, a más tardar, el 4 de diciembre";

const ML_TIENDA = [1, 2, 3, 5, 10];
const ML_ENSAR_OUD = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const LS_BORRADOR = "calendario_adviento_borrador";
const PASOS = ["inicio", "dias", "catalogo", "entrega", "resumen"];
// Pasos numerados que ve el cliente en la barra de arriba.
const NOMBRE_PASO = {
  dias: [1, "Elige tu calendario"],
  catalogo: [2, "Elige tus decants"],
  entrega: [3, "Modelo y entrega"],
  resumen: [4, "Revisa y envía"],
};
const TOTAL_PASOS = Object.keys(NOMBRE_PASO).length;

const $ = (n) => `$${formatPrecio(n)}`;

// Tamaños de cada perfume: desde 1 ml (Ensar Oud desde 0.5 ml).
function opcionesMl(p) {
  return p.casa === "Ensar Oud" ? ML_ENSAR_OUD : ML_TIENDA;
}

function leerBorrador() {
  try {
    return JSON.parse(localStorage.getItem(LS_BORRADOR) || "{}");
  } catch {
    return {};
  }
}

function BotonRegresar({ onClick, etiqueta = "Regresar" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-lg"
      style={{ background: DORADO, color: VERDE_OSCURO }}
    >
      ←
    </button>
  );
}

function Encabezado({ compacto = false, paso, onRegresar }) {
  if (compacto) {
    // Barra fija arriba: regresar, título y en qué paso va.
    const [n, nombre] = NOMBRE_PASO[paso] || [];
    return (
      <header
        className="sticky top-0 z-50 h-16 px-3 flex items-center gap-3"
        style={{ background: VERDE_OSCURO, borderBottom: `1px solid ${DORADO}33` }}
      >
        <BotonRegresar onClick={onRegresar} etiqueta="Paso anterior" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: DORADO }}>
            {n ? `Paso ${n} de ${TOTAL_PASOS}` : "Perfumes de Diego"}
          </p>
          <p className="text-2xl leading-tight truncate" style={{ fontFamily: SERIF, color: CREMA }}>
            {nombre || "Calendario de adviento"}
          </p>
        </div>
      </header>
    );
  }
  return (
    <header className="relative overflow-hidden text-center px-4 pt-10 pb-8">
      <RamaPino className="absolute -left-6 -top-4 w-40 sm:w-56 opacity-90" />
      <RamaPino espejo className="absolute -right-6 -top-4 w-40 sm:w-56 opacity-90" />
      <p className="relative text-xs uppercase tracking-[0.3em]" style={{ color: DORADO }}>
        Perfumes de Diego
      </p>
      <h1 className="relative mt-2 text-4xl sm:text-5xl" style={{ fontFamily: SERIF, color: CREMA }}>
        Calendario de adviento
      </h1>
      <p className="relative mt-3 text-sm sm:text-base max-w-md mx-auto" style={{ color: "#d9cfbd" }}>
        Un decant para abrir cada día hasta Navidad, armado con los perfumes que tú elijas.
      </p>
      {FOTO_CALENDARIO && (
        <img
          src={FOTO_CALENDARIO}
          alt="Calendario de adviento de Perfumes de Diego"
          className="relative mt-6 mx-auto w-full max-w-md rounded-xl shadow-2xl"
          style={{ border: `1px solid ${DORADO}55` }}
        />
      )}
    </header>
  );
}

function Aviso({ titulo, children }) {
  return (
    <div className="pl-3 py-1 text-sm leading-relaxed" style={{ borderLeft: `3px solid ${DORADO}`, color: "#e8dfcf" }}>
      <p className="font-semibold mb-0.5 text-xs uppercase tracking-wider" style={{ color: DORADO }}>
        ℹ {titulo}
      </p>
      {children}
    </div>
  );
}

export default function CalendarioAdviento() {
  const { parfums = [], loading } = useParfums() || {};
  const borrador = useMemo(leerBorrador, []);
  const [dias, setDias] = useState(borrador.dias || null);
  const [sel, setSel] = useState(borrador.sel || {}); // { idPerfume: ml }
  // Cada paso es una "página" del historial (?paso=catalogo / resumen), así el
  // botón atrás del celular regresa al paso anterior en vez de salir del sitio.
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const paso = PASOS.includes(params.get("paso")) ? params.get("paso") : "inicio";
  // "ver" en el catálogo: "yo" (todos los perfumes) o "diego" (recomendados).
  const ver = ["yo", "diego"].includes(params.get("ver")) ? params.get("ver") : null;
  const urlDe = (p, v = null) => ({
    search: p === "inicio" ? "" : `?paso=${p}${p === "catalogo" && v ? `&ver=${v}` : ""}`,
  });
  // Camino recorrido dentro del calendario (para que "atrás" y los botones
  // de regresar lleven exactamente al mismo lugar).
  const pila = location.state?.calendarioPila || [paso];
  // Avanzar: agrega una página al historial.
  const irA = (p, v = null) =>
    navigate(urlDe(p, v ?? (p === "catalogo" ? ver : null)), { state: { calendarioPila: [...pila, p] } });
  // Regresar: usa el historial si esa página la abrimos nosotros; si no,
  // reemplaza la página actual.
  const regresarA = (p) => {
    const i = pila.lastIndexOf(p);
    const d = pila.length - 1 - i;
    if (i >= 0 && d > 0) navigate(-d);
    else navigate(urlDe(p, p === "catalogo" ? ver : null), { replace: true, state: { calendarioPila: [p] } });
  };
  const setPaso = (p) => (PASOS.indexOf(p) > PASOS.indexOf(paso) ? irA(p) : regresarA(p));
  // Cambiar entre "elegir yo" y "recomendaciones" sin llenar el historial.
  const cambiarVer = (v) => navigate(urlDe("catalogo", v), { replace: true, state: location.state });
  const [entrega, setEntrega] = useState(borrador.entrega || null); // "puebla" | "envio"
  const [modelo, setModelo] = useState(MODELOS[borrador.modelo] ? borrador.modelo : null);
  const [cp, setCp] = useState(borrador.cp || "");
  const [busq, setBusq] = useState("");
  const [casaFiltro, setCasaFiltro] = useState("");
  const [numero, setNumero] = useState(borrador.numero || null);
  const [preguntar, setPreguntar] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [paso]);

  // Guarda lo que va armando (por si cierra la página).
  useEffect(() => {
    try {
      localStorage.setItem(LS_BORRADOR, JSON.stringify({ dias, sel, entrega, cp, numero, modelo }));
    } catch {
      // sin localStorage
    }
  }, [dias, sel, entrega, cp, numero, modelo]);

  // Catálogo: decants disponibles.
  const catalogo = useMemo(
    () =>
      parfums
        .filter((p) => p.stock !== true && p.disponible === "Disponible" && Number(p.precio) > 0)
        .map((p) => ({ ...p, opciones: opcionesMl(p) }))
        .filter((p) => p.opciones.length > 0)
        .sort(
          (a, b) =>
            String(a.casa).localeCompare(String(b.casa), "es") ||
            String(a.nombre).localeCompare(String(b.nombre), "es"),
        ),
    [parfums],
  );

  // Recomendados de Diego (lista aparte: parfums.recomendado_calendario).
  const [recomendados, setRecomendados] = useState(null); // Set de ids (null = cargando)
  useEffect(() => {
    let vivo = true;
    supabase
      .from("parfums")
      .select("id")
      .eq("recomendado_calendario", true)
      .then(({ data, error }) => {
        if (vivo) setRecomendados(new Set(error ? [] : (data || []).map((r) => r.id)));
      });
    return () => {
      vivo = false;
    };
  }, []);
  const esRecomendado = (p) => !!recomendados?.has(p.id);
  const hayRecomendados = catalogo.some(esRecomendado);
  const modoDiego = ver === "diego" && hayRecomendados;
  // Antes de elegir decants: "Elegir yo" o "Recomendaciones de Diego".
  const mostrarEleccion = paso === "catalogo" && !ver && hayRecomendados;
  const elegirVer = (v) => {
    setCasaFiltro("");
    setBusq("");
    track("calendario_ver", { ver: v });
    navigate(urlDe("catalogo", v), { state: { calendarioPila: [...pila, "catalogo"] } });
  };

  // Botón ← : siempre al paso anterior.
  const regresar = () => {
    if (paso === "resumen") return regresarA("entrega");
    if (paso === "entrega") return regresarA("catalogo");
    if (paso === "catalogo" && ver && hayRecomendados) {
      // Del catálogo a "¿Cómo quieres armarlo?"
      if (pila.length >= 2 && pila[pila.length - 2] === "catalogo") return navigate(-1);
      return navigate(urlDe("catalogo"), { replace: true, state: { calendarioPila: ["inicio", "dias", "catalogo"] } });
    }
    if (paso === "catalogo") return regresarA("dias");
    if (paso === "dias") return regresarA("inicio");
    return navigate("/home");
  };

  const base = useMemo(
    () => (modoDiego ? catalogo.filter((p) => recomendados.has(p.id)) : catalogo),
    [catalogo, modoDiego, recomendados],
  );

  // Al buscar, siempre se busca en todo el catálogo (aunque esté viendo los
  // recomendados de Diego).
  const buscando = busq.trim() !== "";
  const visibles = useMemo(() => {
    const q = normalizarTexto(busq.trim());
    return (q ? catalogo : base).filter(
      (p) => (!casaFiltro || p.casa === casaFiltro) && (!q || normalizarTexto(`${p.nombre} ${p.casa}`).includes(q)),
    );
  }, [base, catalogo, busq, casaFiltro]);

  const casas = useMemo(() => [...new Set(base.map((p) => p.casa).filter(Boolean))], [base]);

  const elegidos = useMemo(
    () =>
      catalogo
        .filter((p) => p.opciones.includes(sel[p.id]))
        .map((p) => ({ ...p, ml: sel[p.id], monto: calcularPrecioDecant(p, sel[p.id]) })),
    [catalogo, sel],
  );

  // Selecciones guardadas que ya no son válidas (perfume agotado o un tamaño
  // que se quitó, como 30 ml) se descartan al cargar el catálogo.
  useEffect(() => {
    if (!catalogo.length) return;
    setSel((prev) => {
      const limpio = {};
      for (const p of catalogo) if (p.opciones.includes(prev[p.id])) limpio[p.id] = prev[p.id];
      return Object.keys(limpio).length === Object.keys(prev).length ? prev : limpio;
    });
  }, [catalogo]);

  const cal = dias ? CALENDARIOS[dias] : null;

  const cuantos = elegidos.length;
  // El calendario (12 o 24 días) se elige al inicio: de N a 2N decants.
  const minimo = cal?.dias || MIN_DECANTS;
  const maximo = cal ? cal.dias * 2 : MAX_DECANTS;
  const lleno = cuantos >= maximo;
  const decantsListos = !!cal && cabeEn(cal, cuantos);
  const totalDecants = elegidos.reduce((s, x) => s + x.monto, 0);

  // Sin calendario elegido no hay catálogo ni pasos siguientes: regresa al inicio.
  useEffect(() => {
    if (paso !== "inicio" && paso !== "dias" && !cal && !listo)
      navigate(urlDe("dias"), { replace: true, state: { calendarioPila: ["inicio", "dias"] } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, cal]);

  // Si ya no alcanza (o se pasa) de decants, regresa al catálogo.
  useEffect(() => {
    if ((paso === "resumen" || paso === "entrega") && cal && catalogo.length && !decantsListos && !listo)
      regresarA("catalogo");
    // Sin entrega elegida no se puede revisar: regresa a elegirla.
    else if (paso === "resumen" && catalogo.length && (!modelo || !entrega || (entrega === "envio" && cp.length !== 5)) && !listo)
      regresarA("entrega");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, catalogo.length, cuantos, listo, entrega, cp]);
  const envioGratis = totalDecants >= UMBRAL_ENVIO_GRATIS;
  const costoEnvio = entrega === "envio" && !envioGratis ? ENVIO_REGULAR : 0;
  const total = totalDecants + (cal?.precio || 0) + costoEnvio;
  const faltaCp = entrega === "envio" && cp.length !== 5;
  const listoParaEnviar = !!cal && !!modelo && !!entrega && !faltaCp && !!numero;
  const nombreModelo = MODELOS[modelo]?.nombre || "";

  const elegirMl = (p, ml) => {
    setSel((prev) => {
      const nuevo = { ...prev };
      if (prev[p.id] === ml) delete nuevo[p.id];
      else if (prev[p.id] || Object.keys(prev).length < maximo) nuevo[p.id] = ml;
      return nuevo;
    });
  };

  const datosPedido = () => {
    const nombreCal = `Calendario de adviento ${dias} días · ${nombreModelo} · ${
      entrega === "puebla" ? "Entrega personal en Puebla (armado)" : "Envío (desarmado, decants por separado)"
    }`;
    return {
      items: [
        ...elegidos.map((x) => ({
          id: x.id,
          nombre: x.nombre,
          casa: x.casa || null,
          image: x.image || null,
          tipoVenta: "decant",
          mililitros: x.ml,
          cantidad: null,
          precioUnitario: Number(x.precio) || 0,
          subtotal: x.monto,
        })),
        { tipoVenta: "calendario", nombre: nombreCal, subtotal: cal.precio },
      ],
      subtotal: totalDecants + cal.precio,
      descuento: 0,
      codigo_descuento: null,
      envio: costoEnvio,
      total,
      codigo_postal: entrega === "envio" && cp.length === 5 ? cp : null,
    };
  };

  // Mismo formato que el pedido normal de la tienda.
  const mensaje = (n) =>
    [
      `Hola Diego, me gustaría realizar mi pedido${n ? ` #${n}` : ""}:`,
      "",
      `Calendario de adviento de ${dias} días · Modelo ${nombreModelo} (${cuantos} decants)`,
      entrega === "puebla"
        ? "Entrega personal en Puebla (calendario armado)"
        : "Envío a domicilio (calendario desarmado y decants por separado)",
      "",
      ...elegidos.map((x) => `${x.ml} ml de ${x.nombre} (${$(x.monto)})`),
      "",
      `Decants: ${$(totalDecants)}`,
      `Calendario ${dias} días: ${$(cal.precio)}`,
      ...(entrega === "envio"
        ? [envioGratis ? "Envío: Gratis" : `Envío (DHL zona regular): ${$(ENVIO_REGULAR)}`]
        : []),
      `Total a pagar: ${$(total)}`,
      "",
      ...(entrega === "envio" ? [`Mi código postal: ${cp}`] : []),
      "Gracias!",
    ].join("\n");

  // Pide número en cuanto llega al resumen y guarda el pedido (aunque no lo envíe).
  useEffect(() => {
    if (paso !== "resumen" || !cal || !cabeEn(cal, cuantos)) return;
    let vivo = true;
    (async () => {
      const n = numero || (await pedirNumeroNuevo());
      if (!vivo) return;
      if (!numero) setNumero(n);
      registrarPedidoWeb(n, datosPedido());
    })();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, entrega, cp, numero, dias]);

  const enviar = () => {
    if (!listoParaEnviar) return;
    track("calendario_whatsapp", { dias, total });
    marcarPedidoWeb(numero, "enviado", datosPedido());
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje(numero))}`, "_blank", "noopener,noreferrer");
    setPreguntar(true);
  };

  const confirmar = () => {
    track("calendario_confirmado", { dias, total });
    marcarPedidoWeb(numero, "confirmado", datosPedido());
    try {
      localStorage.removeItem(LS_BORRADOR);
    } catch {
      // sin localStorage
    }
    setListo(true);
  };

  const empezarOtro = () => {
    setDias(null);
    setSel({});
    setEntrega(null);
    setModelo(null);
    setCp("");
    setNumero(null);
    setPreguntar(false);
    setListo(false);
    setPaso("inicio");
  };

  const fondo = {
    minHeight: "100vh",
    background: `radial-gradient(ellipse at top, ${VERDE} 0%, ${VERDE_OSCURO} 55%, #0b2419 100%)`,
    color: CREMA,
  };

  const boton = (activo = true) => ({
    background: activo ? ROJO_BOTON : "rgba(255,255,255,0.12)",
    color: activo ? "#fff" : "#a99f8f",
    border: `1px solid ${activo ? DORADO : "transparent"}`,
  });

  return (
    <div style={fondo}>
      <Helmet>
        <title>Calendario de adviento | Perfumes de Diego</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&display=swap"
        />
      </Helmet>
      <Nieve />

      <div className="relative z-30 max-w-2xl mx-auto pb-36">
        {paso === "inicio" && (
          <div className="fixed top-3 left-3 z-50">
            <BotonRegresar onClick={regresar} etiqueta="Regresar a la tienda" />
          </div>
        )}
        <Encabezado compacto={paso !== "inicio"} paso={paso} onRegresar={regresar} />

        {/* ---------- Paso 1: cómo funciona ---------- */}
        {paso === "inicio" && (
          <section className="px-4 space-y-4">
            <RegaloSorpresa />
            <Aviso titulo="Cómo funciona">
              Primero eliges tus perfumes y cuántos ml quieres de cada uno. Al final escoges tu calendario
              según cuántos decants elegiste. El total es la suma de tus decants más el calendario.
            </Aviso>
            <Aviso titulo="Entrega">
              El calendario completamente armado solo se entrega personalmente en Puebla. Para envíos, el
              calendario va desarmado y los decants por separado, para que no se dañe en el camino.
            </Aviso>
            <Aviso titulo="Fechas">
              Debido a unos atrasos, los calendarios se empezarán a enviar aproximadamente {FECHAS_ENVIO}.
            </Aviso>
            <Aviso titulo="Cupones">
              Los cupones y códigos de descuento de la tienda no se pueden usar en los calendarios de adviento.
            </Aviso>
            <h2 className="text-center text-2xl pt-4" style={{ fontFamily: SERIF }}>
              Modelos
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(MODELOS).map((m) => (
                <figure
                  key={m.nombre}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: FONDO_TARJETA, border: `1px solid ${DORADO}88` }}
                >
                  <img src={m.foto} alt={`Calendario modelo ${m.nombre}`} loading="lazy" className="w-full aspect-[4/3] object-cover" />
                  <figcaption className="text-center text-sm font-semibold py-2 px-2">
                    {m.nombre}
                    {m.aviso && (
                      <span className="block text-[11px] font-semibold mt-1 leading-snug" style={{ color: "#f0b4b8" }}>
                        ⚠ {m.aviso}
                      </span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="text-xs text-center -mt-1" style={{ color: "#d9cfbd" }}>
              Los dos modelos vienen en 12 y 24 días y cuestan lo mismo. El modelo lo eliges al final.
            </p>
            <button
              type="button"
              onClick={() => {
                setPaso("dias");
                track("calendario_empezar", {});
              }}
              className="w-full py-4 rounded-xl font-semibold text-lg shadow-lg active:scale-[0.99]"
              style={boton(true)}
            >
              Empezar
            </button>
          </section>
        )}

        {/* ---------- Paso 1: días ---------- */}
        {paso === "dias" && (
          <section className="px-4 pt-4 space-y-4">
            <h2 className="text-center text-2xl" style={{ fontFamily: SERIF }}>
              ¿De cuántos días lo quieres?
            </h2>
            <p className="text-sm text-center -mt-2" style={{ color: "#d9cfbd" }}>
              Un decant por día como mínimo y hasta el doble. El modelo lo eliges al final.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(CALENDARIOS).map((c) => (
                <button
                  key={c.dias}
                  type="button"
                  onClick={() => {
                    setDias(c.dias);
                    setPaso("catalogo");
                    track("calendario_elegido", { dias: c.dias });
                  }}
                  className="rounded-2xl p-4 pb-3 text-center shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98] flex flex-col"
                  style={{ background: FONDO_TARJETA, border: `2px solid ${DORADO}` }}
                >
                  <span className="block text-5xl font-light tabular-nums leading-none pt-1" style={{ color: DORADO }}>
                    {c.dias}
                  </span>
                  <span className="block text-sm uppercase tracking-widest mt-1">días</span>
                  <span className="block text-xs mt-3" style={{ color: "#d9cfbd" }}>
                    De {c.dias} a {c.dias * 2} decants
                  </span>
                  <span
                    className="block mt-3 py-2.5 rounded-lg text-sm font-semibold"
                    style={{ background: ROJO_BOTON, color: "#fff", border: `1px solid ${DORADO}` }}
                  >
                    Elegir {c.dias} días
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ---------- Paso 2: catálogo ---------- */}
        {paso === "catalogo" && !ver && recomendados === null && (
          <p className="px-4 text-center text-sm" style={{ color: "#d9cfbd" }}>
            Cargando…
          </p>
        )}

        {mostrarEleccion && (
          <section className="px-4 space-y-4 pt-2">
            <h2 className="text-center text-2xl" style={{ fontFamily: SERIF }}>
              ¿Cómo quieres armarlo?
            </h2>
            {[
              ["yo", "Elegir yo", "Escoger entre todo el catálogo."],
              ["diego", "Ver las recomendaciones de Diego", "Mis favoritos para esta Navidad."],
            ].map(([v, t, d]) => (
              <button
                key={v}
                type="button"
                onClick={() => elegirVer(v)}
                className="w-full text-left rounded-2xl p-5 shadow-lg flex items-center gap-4 transition-transform active:scale-[0.99]"
                style={{ background: v === "diego" ? ROJO_BOTON : FONDO_TARJETA, border: `2px solid ${DORADO}` }}
              >
                <span
                  className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-2xl"
                  style={{ background: DORADO, color: VERDE_OSCURO }}
                  aria-hidden="true"
                >
                  {v === "diego" ? "★" : "✎"}
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-semibold">{t}</span>
                  <span className="block text-sm mt-0.5" style={{ color: "#e8dfcf" }}>
                    {d}
                  </span>
                </span>
              </button>
            ))}
          </section>
        )}

        {paso === "catalogo" && cal && !mostrarEleccion && !(!ver && recomendados === null) && (
          <section className="px-4 pt-4 space-y-4">
            {modoDiego ? (
              <div className="rounded-xl p-4" style={{ background: ROJO_BOTON, border: `2px solid ${DORADO}` }}>
                <p className="text-xl" style={{ fontFamily: SERIF }}>
                  ★ Mis recomendados para Navidad
                </p>
                <p className="text-sm mt-1" style={{ color: "#f3e6e6" }}>
                  Calendario de {dias} días: elige de {minimo} a {maximo} decants. Toca los ml que quieres de cada perfume.
                </p>
                <button
                  type="button"
                  onClick={() => cambiarVer("yo")}
                  className="mt-3 px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ background: "#FBF7EE", color: VERDE_OSCURO }}
                >
                  Ver todos los perfumes
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm" style={{ color: "#d9cfbd" }}>
                  Calendario de {dias} días: elige de {minimo} a {maximo} decants. Toca los ml que quieres de cada perfume.
                </p>
                {hayRecomendados && (
                  <button
                    type="button"
                    onClick={() => cambiarVer("diego")}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ border: `1px solid ${DORADO}`, color: DORADO }}
                  >
                    ★ Ver recomendaciones de Diego
                  </button>
                )}
              </div>
            )}
            {/* Buscador y casas: se quedan arriba al bajar */}
            <div className="sticky top-16 z-40 -mx-4 px-4 pt-2 pb-2 space-y-2" style={{ background: VERDE_OSCURO }}>
              {cuantos > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold" style={{ color: DORADO }}>
                    {cuantos} {cuantos === 1 ? "decant elegido" : "decants elegidos"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Quitar los ${cuantos} decants que elegiste?`)) {
                        setSel({});
                        track("calendario_quitar_todos", { cuantos });
                      }
                    }}
                    className="shrink-0 px-4 py-2 rounded-full text-sm font-bold"
                    style={{ background: "#FBF7EE", color: "#8A1820", border: "2px solid #f0b4b8" }}
                  >
                    ✕ Quitar todos
                  </button>
                </div>
              )}
              <input
                value={busq}
                onChange={(e) => setBusq(e.target.value)}
                placeholder="🔍 Buscar perfume o casa"
                className="w-full rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#C9A24B] placeholder:text-gray-500"
                style={CAMPO}
              />
              <FilaDeslizable rueda className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1">
                {["", ...casas].map((c) => {
                  const activa = casaFiltro === c;
                  return (
                    <button
                      key={c || "todas"}
                      type="button"
                      onClick={() => setCasaFiltro(c)}
                      className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{
                        background: activa ? DORADO : FONDO_CAMPO,
                        color: activa ? VERDE_OSCURO : CREMA,
                        border: `1px solid ${activa ? DORADO : "rgba(255,255,255,0.2)"}`,
                      }}
                    >
                      {c || "Todas"}
                    </button>
                  );
                })}
              </FilaDeslizable>
            </div>
            {loading && <p className="text-center text-sm">Cargando perfumes…</p>}
            <ul className="space-y-2">
              {visibles.map((p) => {
                const elegido = sel[p.id];
                const bloqueado = lleno && !elegido;
                return (
                  <li
                    key={p.id}
                    className={`p-2.5 rounded-xl overflow-hidden ${bloqueado ? "opacity-40" : ""}`}
                    style={{
                      background: elegido ? FONDO_ELEGIDO : FONDO_TARJETA,
                      border: `1px solid ${elegido ? DORADO : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={imagenThumb(p.image, 120)}
                        alt={p.nombre}
                        loading="lazy"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                      />
                      <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {(!modoDiego || buscando) && esRecomendado(p) && (
                              <span style={{ color: DORADO }} title="Recomendado por Diego">
                                ★{" "}
                              </span>
                            )}
                            {p.nombre}
                          </p>
                          <p className="text-xs truncate" style={{ color: "#bfb5a3" }}>
                            {p.casa} · {$(p.precio)}/ml
                          </p>
                        </div>
                        {elegido && (
                          <button
                            type="button"
                            onClick={() => elegirMl(p, elegido)}
                            className="shrink-0 px-2.5 py-1.5 rounded-full text-xs font-semibold"
                            style={{ color: "#f0b4b8", border: "1px solid #f0b4b8" }}
                          >
                            ✕ Quitar
                          </button>
                        )}
                      </div>
                    </div>
                      <FilaDeslizable className="flex gap-2 mt-2.5 overflow-x-auto -mx-2.5 px-2.5 md:mx-0 md:px-0 pb-0.5">
                        {p.opciones.map((ml) => {
                          const activo = elegido === ml;
                          return (
                            <button
                              key={ml}
                              type="button"
                              disabled={bloqueado}
                              onClick={() => elegirMl(p, ml)}
                              className="shrink-0 whitespace-nowrap px-3 min-h-[36px] rounded-full text-sm font-semibold"
                              style={{
                                background: activo ? DORADO : "transparent",
                                color: activo ? VERDE_OSCURO : CREMA,
                                border: `1px solid ${activo ? DORADO : "rgba(255,255,255,0.25)"}`,
                              }}
                            >
                              {ml} ml · {$(calcularPrecioDecant(p, ml))}
                            </button>
                          );
                        })}
                      </FilaDeslizable>
                  </li>
                );
              })}
            </ul>
            {!loading && visibles.length === 0 && (
              <p className="text-center text-sm" style={{ color: "#d9cfbd" }}>
                No encontré perfumes con esa búsqueda.
              </p>
            )}
          </section>
        )}

        {/* ---------- Paso 2: cómo lo recibe ---------- */}
        {paso === "entrega" && decantsListos && (
          <section className="px-4 space-y-4 pt-2">
            <div className="space-y-3">
              <h2 className="text-2xl text-center" style={{ fontFamily: SERIF, color: CREMA }}>
                Elige el modelo
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(MODELOS).map(([k, m]) => {
                  const activo = modelo === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={activo}
                      onClick={() => {
                        setModelo(k);
                        track("calendario_modelo", { modelo: k });
                      }}
                      className="rounded-xl overflow-hidden text-left shadow-lg transition-transform active:scale-[0.99] flex flex-col justify-start"
                      style={{
                        background: activo ? ROJO_BOTON : FONDO_TARJETA,
                        border: `2px solid ${activo ? DORADO : `${DORADO}88`}`,
                      }}
                    >
                      <img src={m.foto} alt={`Calendario modelo ${m.nombre}`} className="w-full aspect-[4/3] object-cover" />
                      <span className="flex items-center gap-2 px-3 py-2.5">
                        <span
                          className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                          style={{ border: `2px solid ${DORADO}`, background: activo ? DORADO : "transparent" }}
                        >
                          {activo && <span className="w-2 h-2 rounded-full" style={{ background: ROJO_BOTON }} />}
                        </span>
                        <span className="text-sm font-semibold">{m.nombre}</span>
                      </span>
                      {m.aviso && (
                        <span
                          className="block px-3 pb-2.5 -mt-1 text-[11px] font-semibold leading-snug"
                          style={{ color: activo ? "#ffe3e5" : "#f0b4b8" }}
                        >
                          ⚠ {m.aviso}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl text-center" style={{ fontFamily: SERIF, color: CREMA }}>
                ¿Cómo quieres recibirlo?
              </h2>
              {[
                ["puebla", "Entrega personal en Puebla", "Te lo entrego completamente armado. Sin costo de envío."],
                [
                  "envio",
                  "Envío a domicilio (DHL)",
                  `El calendario va desarmado y los decants por separado, para que no se dañe en el camino. ${$(ENVIO_REGULAR)} a zona regular; gratis si tus decants suman ${$(UMBRAL_ENVIO_GRATIS)} o más.`,
                ],
              ].map(([k, t, d]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setEntrega(k)}
                  role="radio"
                  aria-checked={entrega === k}
                  className="w-full text-left rounded-xl p-4 flex items-start gap-3 shadow-lg transition-transform active:scale-[0.99]"
                  style={{
                    background: entrega === k ? ROJO_BOTON : FONDO_TARJETA,
                    border: `2px solid ${entrega === k ? DORADO : `${DORADO}88`}`,
                  }}
                >
                  <span
                    className="mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                    style={{ border: `2px solid ${DORADO}`, background: entrega === k ? DORADO : "transparent" }}
                  >
                    {entrega === k && <span className="w-2 h-2 rounded-full" style={{ background: ROJO_BOTON }} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold">{t}</span>
                    <span className="block text-xs mt-1" style={{ color: entrega === k ? "#f3e6e6" : "#d9cfbd" }}>
                      {d}
                    </span>
                  </span>
                </button>
              ))}
              {entrega === "envio" && (
                <label className="block pt-1">
                  <span className="block text-sm font-semibold mb-1.5" style={{ color: CREMA }}>
                    Escribe tu código postal
                  </span>
                  <input
                    value={cp}
                    onChange={(e) => setCp(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="Ej. 72000"
                    className="w-full rounded-lg px-4 py-3 text-lg font-semibold tracking-wider focus:outline-none focus:ring-2 focus:ring-[#C9A24B] placeholder:text-gray-400 placeholder:font-normal"
                    style={CAMPO}
                  />
                  <span className="block text-xs mt-1.5" style={{ color: "#d9cfbd" }}>
                    Si es zona extendida de DHL, te aviso el costo adicional por WhatsApp.
                  </span>
                </label>
              )}
            </div>
            <button
              type="button"
              disabled={!cal || !modelo || !entrega || faltaCp}
              onClick={() => setPaso("resumen")}
              className="w-full py-3.5 rounded-xl font-semibold text-base disabled:cursor-not-allowed"
              style={boton(!!cal && !!modelo && !!entrega && !faltaCp)}
            >
              {!cal ? "Elige tu calendario" : !modelo ? "Elige el modelo" : !entrega ? "Elige una opción" : faltaCp ? "Escribe tu código postal" : "Siguiente"}
            </button>
          </section>
        )}

        {/* ---------- Paso 3: revisa y envía ---------- */}
        {paso === "resumen" && decantsListos && modelo && entrega && (
          <section className="px-4 space-y-4 pt-2">
            <div className="rounded-xl text-sm" style={{ background: FONDO_TARJETA, border: `1px solid ${DORADO}40` }}>
              <div className="px-4 py-3 flex justify-between gap-3">
                <span>
                  <span className="block text-xs uppercase tracking-wider" style={{ color: DORADO }}>
                    Calendario
                  </span>
                  <span className="font-semibold">
                    Calendario de adviento de {dias} días · {nombreModelo}
                  </span>
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between items-center gap-3" style={{ borderTop: `1px solid ${DORADO}40` }}>
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-wider" style={{ color: DORADO }}>
                    Entrega
                  </span>
                  <span className="font-semibold">
                    {entrega === "puebla" ? "En persona en Puebla (armado)" : `Envío DHL a CP ${cp} (desarmado)`}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setPaso("entrega")}
                  className="shrink-0 text-xs font-semibold underline"
                  style={{ color: DORADO }}
                >
                  Cambiar
                </button>
              </div>
            </div>

            <details className="rounded-xl group" style={{ background: FONDO_TARJETA, border: `1px solid ${DORADO}40` }}>
              <summary className="list-none cursor-pointer px-4 py-3 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">Ver tus {cuantos} decants</span>
                <span className="flex items-center gap-2">
                  {$(totalDecants)}
                  <span className="transition-transform group-open:rotate-180" style={{ color: DORADO }}>
                    ▾
                  </span>
                </span>
              </summary>
            <ul className="divide-y" style={{ borderTop: `1px solid ${DORADO}40` }}>
              {elegidos.map((x) => (
                <li key={x.id} className="flex justify-between gap-3 px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <span className="min-w-0">
                    {x.nombre} <span style={{ color: "#bfb5a3" }}>· {x.ml} ml</span>
                  </span>
                  <span className="whitespace-nowrap">{$(x.monto)}</span>
                </li>
              ))}
            </ul>
              <button
                type="button"
                onClick={() => setPaso("catalogo")}
                className="w-full px-4 py-3 text-sm font-semibold text-left"
                style={{ color: DORADO, borderTop: `1px solid ${DORADO}40` }}
              >
                ← Cambiar decants
              </button>
            </details>

            <div className="rounded-xl p-4 space-y-1 text-sm" style={{ background: "#0E2A1D", border: `1px solid ${DORADO}` }}>
              <div className="flex justify-between">
                <span>{cuantos} decants</span>
                <span>{$(totalDecants)}</span>
              </div>
              {cal && (
                <div className="flex justify-between">
                  <span>Calendario {dias} días</span>
                  <span>{$(cal.precio)}</span>
                </div>
              )}
              {entrega && (
                <div className="flex justify-between">
                  <span>{entrega === "puebla" ? "Entrega en Puebla" : "Envío DHL"}</span>
                  <span>{entrega === "puebla" || envioGratis ? "Gratis" : $(ENVIO_REGULAR)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 mt-1" style={{ borderTop: `1px solid ${DORADO}55` }}>
                <span>Total</span>
                <span>{$(total)}</span>
              </div>
            </div>
            <p className="text-xs text-center -mt-2" style={{ color: "#d9cfbd" }}>
              Los cupones de descuento no aplican en calendarios.
            </p>

            {!listo && !preguntar && (
              <button
                type="button"
                onClick={enviar}
                disabled={!listoParaEnviar}
                className="w-full py-3.5 rounded-xl font-semibold text-base disabled:cursor-not-allowed"
                style={boton(listoParaEnviar)}
              >
                {numero ? "Enviar mi pedido por WhatsApp" : "Preparando tu pedido…"}
              </button>
            )}

            {preguntar && !listo && (
              <div className="rounded-xl p-4 text-sm space-y-3" style={{ background: FONDO_TARJETA, border: `1px solid ${DORADO}` }}>
                <p className="font-semibold">¿Ya enviaste tu pedido por WhatsApp?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={confirmar} className="py-2.5 rounded-lg font-semibold" style={boton(true)}>
                    Sí, ya lo envié
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreguntar(false)}
                    className="py-2.5 rounded-lg"
                    style={{ border: "1px solid rgba(255,255,255,0.3)" }}
                  >
                    No se abrió
                  </button>
                </div>
                <p className="text-xs" style={{ color: "#d9cfbd" }}>
                  Si no se abre, escríbeme al <span className="font-semibold whitespace-nowrap">+52 221 203 4647</span> con
                  tu número de pedido #{numero}.
                </p>
              </div>
            )}

            {listo && (
              <div className="rounded-xl p-5 text-center space-y-2" style={{ background: "rgba(179,32,42,0.3)", border: `1px solid ${DORADO}` }}>
                <MonoRegalo className="mx-auto w-14 h-14" />
                <p className="text-xl" style={{ fontFamily: SERIF }}>
                  ¡Gracias! Recibí tu pedido #{numero}
                </p>
                <p className="text-sm" style={{ color: "#e8dfcf" }}>
                  Te confirmo todo por WhatsApp.
                </p>
                <button type="button" onClick={empezarOtro} className="text-sm underline" style={{ color: DORADO }}>
                  Armar otro calendario
                </button>
              </div>
            )}

            {!listo && (
              <p className="text-xs text-center" style={{ color: "#d9cfbd" }}>
                Los calendarios se empiezan a enviar {FECHAS_ENVIO}. Trae un código con un regalo sorpresa.
              </p>
            )}
          </section>
        )}
      </div>

      {/* Barra fija con el avance (en el catálogo) */}
      {paso === "catalogo" && cal && !mostrarEleccion && (
        <div
          className="fixed bottom-0 inset-x-0 z-40 px-4 py-3"
          style={{ background: "rgba(11,36,25,0.96)", borderTop: `1px solid ${DORADO}`, backdropFilter: "blur(6px)" }}
        >
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">
                {cuantos} {cuantos === 1 ? "decant" : "decants"}
                {cuantos < minimo ? (
                  <span style={{ color: "#f0b4b8" }}> · faltan {minimo - cuantos}</span>
                ) : cuantos > maximo ? (
                  <span style={{ color: "#f0b4b8" }}> · quita {cuantos - maximo}</span>
                ) : lleno ? (
                  <span style={{ color: DORADO }}> · llegaste al máximo</span>
                ) : (
                  <span style={{ color: DORADO }}>
                    {" "}
                    · puedes agregar {maximo - cuantos} {maximo - cuantos === 1 ? "decant" : "decants"} más
                  </span>
                )}
              </p>
              <p className="text-xs truncate" style={{ color: "#d9cfbd" }}>
                Calendario de {dias} días · mín {minimo} · máx {maximo} · Decants {$(totalDecants)}
              </p>
              <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (cuantos / minimo) * 100)}%`,
                    background: decantsListos ? DORADO : ROJO,
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={!decantsListos}
              onClick={() => setPaso("entrega")}
              className="shrink-0 px-5 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
              style={boton(decantsListos)}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
