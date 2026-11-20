import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
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
// Foto de los calendarios (portada).
const FOTO_CALENDARIO = "/calendario-adviento.jpg";

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

function Encabezado() {
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
    <div className="rounded-xl p-4 text-sm leading-relaxed" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${DORADO}40`, color: "#e8dfcf" }}>
      <p className="font-semibold mb-1" style={{ color: DORADO }}>
        {titulo}
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
  const [paso, setPaso] = useState(borrador.dias ? "catalogo" : "inicio");
  const [entrega, setEntrega] = useState(borrador.entrega || null); // "puebla" | "envio"
  const [cp, setCp] = useState(borrador.cp || "");
  const [busq, setBusq] = useState("");
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

  const visibles = useMemo(() => {
    const q = normalizarTexto(busq.trim());
    if (!q) return catalogo;
    return catalogo.filter((p) => normalizarTexto(`${p.nombre} ${p.casa}`).includes(q));
  }, [catalogo, busq]);

  const elegidos = useMemo(
    () =>
      catalogo
        .filter((p) => sel[p.id])
        .map((p) => ({ ...p, ml: sel[p.id], monto: calcularPrecioDecant(p, sel[p.id]) })),
    [catalogo, sel],
  );

  const cal = dias ? CALENDARIOS[dias] : null;
  const minimo = cal?.dias || 0;
  const maximo = minimo * 2;
  const cuantos = elegidos.length;
  const lleno = cuantos >= maximo;
  const totalDecants = elegidos.reduce((s, x) => s + x.monto, 0);
  const envioGratis = totalDecants >= UMBRAL_ENVIO_GRATIS;
  const costoEnvio = entrega === "envio" && !envioGratis ? ENVIO_REGULAR : 0;
  const total = totalDecants + (cal?.precio || 0) + costoEnvio;

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

  const mensaje = (n) =>
    [
      `Hola Diego, quiero mi calendario de adviento de ${dias} días${n ? ` (pedido #${n})` : ""}:`,
      "",
      `${cuantos} decants:`,
      ...elegidos.map((x) => `• ${x.nombre} (${x.casa}) · ${x.ml} ml — ${$(x.monto)}`),
      "",
      `Decants: ${$(totalDecants)}`,
      `Calendario ${dias} días: ${$(cal.precio)}`,
      entrega === "puebla"
        ? "Entrega: personal en Puebla (calendario armado)"
        : `Envío (calendario desarmado y decants por separado): ${envioGratis ? "Gratis" : $(ENVIO_REGULAR)}`,
      ...(entrega === "envio"
        ? [cp.length === 5 ? `Mi código postal: ${cp}` : "Te paso mi código postal por aquí para revisar la zona de envío."]
        : []),
      `Total: ${$(total)}`,
      "",
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
    if (!entrega || !numero) return;
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
    background: activo ? ROJO : "rgba(255,255,255,0.12)",
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
        <Encabezado />

        {/* ---------- Paso 1: elegir calendario ---------- */}
        {paso === "inicio" && (
          <section className="px-4 space-y-4">
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
                    background: "rgba(255,255,255,0.10)",
                    border: `2px solid ${dias === c.dias ? DORADO : `${DORADO}88`}`,
                  }}
                >
                  <span className="block text-5xl" style={{ fontFamily: SERIF, color: DORADO }}>
                    {c.dias}
                  </span>
                  <span className="block text-sm uppercase tracking-widest mt-1">días</span>
                  <span className="block text-xs mt-3" style={{ color: "#d9cfbd" }}>
                    Mínimo {c.dias} · máximo {c.dias * 2} decants
                  </span>
                  <span className="block text-sm font-semibold mt-1">Calendario +{$(c.precio)}</span>
                  <span
                    className="block mt-3 py-2.5 rounded-lg text-sm font-semibold"
                    style={{ background: ROJO, color: "#fff", border: `1px solid ${DORADO}` }}
                  >
                    Elegir {c.dias} días
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ---------- Paso 2: catálogo ---------- */}
        {paso === "catalogo" && cal && (
          <section className="px-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={() => setPaso("inicio")} className="text-sm underline" style={{ color: "#d9cfbd" }}>
                ← Cambiar calendario
              </button>
              <span className="text-sm" style={{ color: DORADO }}>
                Calendario de {dias} días
              </span>
            </div>
            <h2 className="text-2xl text-center" style={{ fontFamily: SERIF }}>
              Elige tus decants
            </h2>
            <p className="text-center text-sm" style={{ color: "#d9cfbd" }}>
              Mínimo {minimo} y máximo {maximo} decants. Toca los ml que quieres de cada perfume.
            </p>
            <input
              value={busq}
              onChange={(e) => setBusq(e.target.value)}
              placeholder="Buscar perfume o casa"
              className="w-full rounded-lg px-4 py-3 text-base focus:outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${DORADO}55`, color: CREMA }}
            />
            {loading && <p className="text-center text-sm">Cargando perfumes…</p>}
            <ul className="space-y-2">
              {visibles.map((p) => {
                const elegido = sel[p.id];
                const bloqueado = lleno && !elegido;
                return (
                  <li
                    key={p.id}
                    className={`flex gap-3 p-2.5 rounded-xl ${bloqueado ? "opacity-40" : ""}`}
                    style={{
                      background: elegido ? "rgba(179,32,42,0.28)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${elegido ? DORADO : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <img
                      src={imagenThumb(p.image, 120)}
                      alt={p.nombre}
                      loading="lazy"
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{p.nombre}</p>
                      <p className="text-xs truncate" style={{ color: "#bfb5a3" }}>
                        {p.casa} · {$(p.precio)}/ml
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {p.opciones.map((ml) => {
                          const activo = elegido === ml;
                          return (
                            <button
                              key={ml}
                              type="button"
                              disabled={bloqueado}
                              onClick={() => elegirMl(p, ml)}
                              className="px-2.5 py-1 rounded-full text-xs font-semibold"
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
                      </div>
                    </div>
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
            <button type="button" onClick={() => setPaso("catalogo")} className="text-sm underline" style={{ color: "#d9cfbd" }}>
              ← Cambiar decants
            </button>
            <h2 className="text-2xl text-center" style={{ fontFamily: SERIF }}>
              Tu calendario de {dias} días
            </h2>

            <ul className="rounded-xl divide-y" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${DORADO}40` }}>
              {elegidos.map((x) => (
                <li key={x.id} className="flex justify-between gap-3 px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <span className="min-w-0">
                    {x.nombre} <span style={{ color: "#bfb5a3" }}>· {x.ml} ml</span>
                  </span>
                  <span className="whitespace-nowrap">{$(x.monto)}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              <p className="font-semibold" style={{ color: DORADO }}>
                ¿Cómo lo recibes?
              </p>
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
                  className="w-full text-left rounded-xl p-3"
                  style={{
                    background: entrega === k ? "rgba(179,32,42,0.3)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${entrega === k ? DORADO : "rgba(255,255,255,0.15)"}`,
                  }}
                >
                  <span className="block text-sm font-semibold">{t}</span>
                  <span className="block text-xs mt-0.5" style={{ color: "#d9cfbd" }}>
                    {d}
                  </span>
                </button>
              ))}
              {entrega === "envio" && (
                <label className="block">
                  <span className="block text-xs mb-1" style={{ color: "#d9cfbd" }}>
                    Tu código postal (opcional): si es zona extendida de DHL, te aviso el costo adicional por
                    WhatsApp.
                  </span>
                  <input
                    value={cp}
                    onChange={(e) => setCp(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    inputMode="numeric"
                    placeholder="Ej. 72000"
                    className="w-full rounded-lg px-4 py-2.5 text-base focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${DORADO}55`, color: CREMA }}
                  />
                </label>
              )}
            </div>

            <Aviso titulo="Fechas">
              Debido a unos atrasos, los calendarios se empezarán a enviar aproximadamente {FECHAS_ENVIO}.
            </Aviso>

            <div className="rounded-xl p-4 space-y-1 text-sm" style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${DORADO}` }}>
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

            {!listo && !preguntar && (
              <button
                type="button"
                onClick={enviar}
                disabled={!entrega || !numero}
                className="w-full py-3.5 rounded-xl font-semibold text-base disabled:cursor-not-allowed"
                style={boton(!!entrega && !!numero)}
              >
                {entrega ? "Enviar mi pedido por WhatsApp" : "Elige cómo lo recibes"}
              </button>
            )}

            {preguntar && !listo && (
              <div className="rounded-xl p-4 text-sm space-y-3" style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${DORADO}` }}>
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
      {paso === "catalogo" && cal && (
        <div
          className="fixed bottom-0 inset-x-0 z-40 px-4 py-3"
          style={{ background: "rgba(11,36,25,0.96)", borderTop: `1px solid ${DORADO}`, backdropFilter: "blur(6px)" }}
        >
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {cuantos} decants{" "}
                <span className="font-normal" style={{ color: "#d9cfbd" }}>
                  (mínimo {minimo}, máximo {maximo})
                </span>
                {cuantos < minimo ? (
                  <span style={{ color: "#f0b4b8" }}> · faltan {minimo - cuantos}</span>
                ) : lleno ? (
                  <span style={{ color: DORADO }}> · llegaste al máximo</span>
                ) : (
                  <span style={{ color: DORADO }}> · puedes agregar {maximo - cuantos} más</span>
                )}
              </p>
              <p className="text-xs" style={{ color: "#d9cfbd" }}>
                Decants {$(totalDecants)} + calendario {$(cal.precio)} = {$(totalDecants + cal.precio)}
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
