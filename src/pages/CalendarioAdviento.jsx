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
// Google): /calendario-adviento. El cliente elige 12 o 24 días, arma sus
// decants (mínimo uno por día, máximo el doble) y manda el pedido por WhatsApp.

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

const CALENDARIOS = {
  12: { dias: 12, precio: 180 },
  24: { dias: 24, precio: 360 },
};
const MINIMO_POR_PERFUME = 200;
const ENVIO_REGULAR = 180;
const FECHAS_ENVIO = "entre el 30 de noviembre y, a más tardar, el 4 de diciembre";

const ML_TIENDA = [1, 2, 3, 5, 10];
const ML_ENSAR_OUD = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const LS_BORRADOR = "calendario_adviento_borrador";
const PASOS = ["inicio", "catalogo", "resumen"];

const $ = (n) => `$${formatPrecio(n)}`;

// Tamaños que llegan al mínimo de $200 por perfume.
function opcionesMl(p) {
  const lista = p.casa === "Ensar Oud" ? ML_ENSAR_OUD : ML_TIENDA;
  return lista.filter((ml) => calcularPrecioDecant(p, ml) >= MINIMO_POR_PERFUME);
}

function leerBorrador() {
  try {
    return JSON.parse(localStorage.getItem(LS_BORRADOR) || "{}");
  } catch {
    return {};
  }
}

function Encabezado({ compacto = false, dias, onCambiar }) {
  if (compacto) {
    return (
      <header className="relative overflow-hidden px-4 pt-4 pb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: DORADO }}>
            Perfumes de Diego
          </p>
          <p className="text-2xl leading-tight truncate" style={{ fontFamily: SERIF, color: CREMA }}>
            Calendario de {dias} días
          </p>
        </div>
        <button
          type="button"
          onClick={onCambiar}
          className="shrink-0 text-xs font-semibold px-3 py-2 rounded-full"
          style={{ border: `1px solid ${DORADO}`, color: DORADO, background: FONDO_CAMPO }}
        >
          Cambiar
        </button>
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
      localStorage.setItem(LS_BORRADOR, JSON.stringify({ dias, sel, entrega, cp, numero }));
    } catch {
      // sin localStorage
    }
  }, [dias, sel, entrega, cp, numero]);

  // Catálogo: decants disponibles con al menos un tamaño de $200 o más.
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

  const base = useMemo(
    () => (modoDiego ? catalogo.filter((p) => recomendados.has(p.id)) : catalogo),
    [catalogo, modoDiego, recomendados],
  );

  const visibles = useMemo(() => {
    const q = normalizarTexto(busq.trim());
    return base.filter(
      (p) => (!casaFiltro || p.casa === casaFiltro) && (!q || normalizarTexto(`${p.nombre} ${p.casa}`).includes(q)),
    );
  }, [base, busq, casaFiltro]);

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

  // Sin calendario elegido no hay catálogo ni resumen: regresa al inicio.
  useEffect(() => {
    if (paso !== "inicio" && !cal) navigate(urlDe("inicio"), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, cal]);
  const minimo = cal?.dias || 0;
  const maximo = minimo * 2;
  const cuantos = elegidos.length;
  const lleno = cuantos >= maximo;
  const totalDecants = elegidos.reduce((s, x) => s + x.monto, 0);

  // Si ya no alcanza el mínimo (p. ej. se descartó algo), regresa al catálogo.
  useEffect(() => {
    if (paso === "resumen" && catalogo.length && cuantos < minimo && !listo) regresarA("catalogo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, catalogo.length, cuantos, minimo, listo]);
  const envioGratis = totalDecants >= UMBRAL_ENVIO_GRATIS;
  const costoEnvio = entrega === "envio" && !envioGratis ? ENVIO_REGULAR : 0;
  const total = totalDecants + (cal?.precio || 0) + costoEnvio;
  const faltaCp = entrega === "envio" && cp.length !== 5;
  const listoParaEnviar = !!entrega && !faltaCp && !!numero;

  const elegirMl = (p, ml) => {
    setSel((prev) => {
      const nuevo = { ...prev };
      if (prev[p.id] === ml) delete nuevo[p.id];
      else if (prev[p.id] || Object.keys(prev).length < maximo) nuevo[p.id] = ml;
      return nuevo;
    });
  };

  const datosPedido = () => {
    const nombreCal = `Calendario de adviento ${dias} días · ${
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
      `Calendario de adviento de ${dias} días (${cuantos} decants)`,
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
    if (paso !== "resumen" || !cal || cuantos < minimo) return;
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
  }, [paso, entrega, cp, numero]);

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
        <Encabezado compacto={paso !== "inicio" && !!cal} dias={dias} onCambiar={() => setPaso("inicio")} />

        {/* ---------- Paso 1: elegir calendario ---------- */}
        {paso === "inicio" && (
          <section className="px-4 space-y-4">
            <RegaloSorpresa />
            <Aviso titulo="Cómo funciona">
              Eliges tus perfumes y cuántos ml quieres de cada uno. El total es la suma de tus decants más
              el calendario.
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
              Selecciona tu calendario:
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(CALENDARIOS).map((c) => (
                <button
                  key={c.dias}
                  type="button"
                  onClick={() => {
                    setDias(c.dias);
                    if (Object.keys(sel).length > c.dias * 2) setSel({});
                    setPaso("catalogo");
                    track("calendario_elegido", { dias: c.dias });
                  }}
                  className="rounded-2xl p-4 pb-3 text-center shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98] flex flex-col"
                  style={{
                    background: FONDO_TARJETA,
                    border: `2px solid ${DORADO}`,
                  }}
                >
                  <span className="block text-5xl font-light tabular-nums leading-none pt-1" style={{ color: DORADO }}>
                    {c.dias}
                  </span>
                  <span className="block text-sm uppercase tracking-widest mt-1">días</span>
                  <span className="block text-xs mt-3" style={{ color: "#d9cfbd" }}>
                    Mínimo {c.dias} · máximo {c.dias * 2} decants
                  </span>
                  <span className="block text-sm font-semibold mt-1">Decants + {$(c.precio)}</span>
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
        {paso === "catalogo" && cal && !ver && recomendados === null && (
          <p className="px-4 text-center text-sm" style={{ color: "#d9cfbd" }}>
            Cargando…
          </p>
        )}

        {mostrarEleccion && cal && (
          <section className="px-4 space-y-4 pt-2">
            <h2 className="text-center text-2xl" style={{ fontFamily: SERIF }}>
              ¿Cómo quieres armarlo?
            </h2>
            {[
              ["yo", "Elegir yo", "Escoge entre todos mis decants."],
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
          <section className="px-4 space-y-4">
            {modoDiego ? (
              <div className="rounded-xl p-4" style={{ background: ROJO_BOTON, border: `2px solid ${DORADO}` }}>
                <p className="text-xl" style={{ fontFamily: SERIF }}>
                  ★ Mis recomendados para Navidad
                </p>
                <p className="text-sm mt-1" style={{ color: "#f3e6e6" }}>
                  Elige de {minimo} a {maximo} decants. Toca los ml que quieres de cada perfume.
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
                  Elige de {minimo} a {maximo} decants. Toca los ml que quieres de cada perfume.
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
            <div className="sticky top-0 z-40 -mx-4 px-4 pt-2 pb-2 space-y-2" style={{ background: VERDE_OSCURO }}>
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
                            {!modoDiego && esRecomendado(p) && (
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

        {/* ---------- Paso 3: resumen y entrega ---------- */}
        {paso === "resumen" && cal && (
          <section className="px-4 space-y-4">
            <p className="text-center">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold"
                style={{ background: "#0E2A1D", border: `1px solid ${DORADO}`, color: DORADO }}
              >
                {cuantos} {cuantos === 1 ? "decant elegido" : "decants elegidos"} · mín {minimo}, máx {maximo}
              </span>
            </p>

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

            <div className="space-y-3 pt-2">
              <h3 className="text-2xl text-center" style={{ fontFamily: SERIF, color: CREMA }}>
                ¿Cómo quieres recibirlo?
              </h3>
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

            <Aviso titulo="Regalo sorpresa">
              Tu calendario trae adentro un código con un regalo sorpresa. Cuando lo recibas, escríbelo en esta
              misma página para descubrir qué te tocó.
            </Aviso>
            <Aviso titulo="Fechas">
              Debido a unos atrasos, los calendarios se empezarán a enviar aproximadamente {FECHAS_ENVIO}.
            </Aviso>

            <div className="rounded-xl p-4 space-y-1 text-sm" style={{ background: "#0E2A1D", border: `1px solid ${DORADO}` }}>
              <div className="flex justify-between">
                <span>{cuantos} decants</span>
                <span>{$(totalDecants)}</span>
              </div>
              <div className="flex justify-between">
                <span>Calendario {dias} días</span>
                <span>{$(cal.precio)}</span>
              </div>
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
                {!entrega
                  ? "Elige cómo quieres recibirlo"
                  : faltaCp
                    ? "Escribe tu código postal"
                    : "Enviar mi pedido por WhatsApp"}
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
              <p className="text-sm font-semibold truncate">
                {cuantos} {cuantos === 1 ? "decant" : "decants"}
                {cuantos < minimo ? (
                  <span style={{ color: "#f0b4b8" }}> · faltan {minimo - cuantos}</span>
                ) : lleno ? (
                  <span style={{ color: DORADO }}> · llegaste al máximo</span>
                ) : (
                  <span style={{ color: DORADO }}> · puedes agregar {maximo - cuantos}</span>
                )}
              </p>
              <p className="text-xs truncate" style={{ color: "#d9cfbd" }}>
                Mín {minimo} · máx {maximo} · Total {$(totalDecants + cal.precio)}
              </p>
              <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (cuantos / minimo) * 100)}%`, background: cuantos >= minimo ? DORADO : ROJO }}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={cuantos < minimo}
              onClick={() => setPaso("resumen")}
              className="shrink-0 px-5 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
              style={boton(cuantos >= minimo)}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
