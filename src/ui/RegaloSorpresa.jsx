import { useState } from "react";
import { track } from "@vercel/analytics";
import { canjearRegalo } from "../functions/regalosCalendario";
import { DORADO, VERDE_OSCURO } from "./Navidad";

// Regalo sorpresa del calendario de adviento: aviso muy visible y, al abrirlo,
// el cliente escribe el código que trae su calendario y se abre la caja con su
// premio.

const SERIF = "'Cormorant Garamond', Georgia, serif";
const CREMA = "#F6EFE2";
const ROJO_BOTON = "#8A1820";
const CAMPO = { background: "#FBF7EE", color: "#1F2A24", border: `2px solid ${DORADO}` };
const LS_REGALO = "calendario_regalo_canjeado";

const MOTIVOS = {
  no_existe: "Ese código no existe. Revisa que esté bien escrito (por ejemplo NAV-7K2QM).",
  usado: "Ese código ya se canjeó. Si crees que es un error, escríbeme por WhatsApp.",
  telefono: "Escribe tu WhatsApp a 10 dígitos.",
  nombre: "Escribe tu nombre.",
  error: "No se pudo revisar ahora. Intenta de nuevo en un momento.",
};

function leerGuardado() {
  try {
    return JSON.parse(localStorage.getItem(LS_REGALO) || "null");
  } catch {
    return null;
  }
}

// Caja de regalo dibujada: se sacude y luego se abre.
function Caja({ fase }) {
  return (
    <div className="relative mx-auto w-28 h-28" aria-hidden="true">
      <div
        className={`absolute inset-x-1 bottom-0 h-[70%] rounded-md ${fase === "sacude" ? "rs-sacude" : ""}`}
        style={{ background: ROJO_BOTON, border: `2px solid ${DORADO}` }}
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4" style={{ background: DORADO }} />
      </div>
      <div
        className={`absolute inset-x-0 top-[18%] h-[22%] rounded-md ${fase === "abierta" ? "rs-tapa" : fase === "sacude" ? "rs-sacude" : ""}`}
        style={{ background: "#A51E28", border: `2px solid ${DORADO}` }}
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4" style={{ background: DORADO }} />
        <div
          className="absolute left-1/2 -top-5 -translate-x-1/2 w-12 h-6 rounded-full"
          style={{ border: `4px solid ${DORADO}`, borderBottomColor: "transparent" }}
        />
      </div>
    </div>
  );
}

export default function RegaloSorpresa() {
  const guardado = leerGuardado();
  const [abierto, setAbierto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [tel, setTel] = useState("");
  const [error, setError] = useState("");
  const [fase, setFase] = useState(guardado ? "abierta" : "cerrada"); // cerrada | sacude | abierta
  const [premio, setPremio] = useState(guardado);

  const descubrir = async (e) => {
    e.preventDefault();
    if (fase === "sacude") return;
    setError("");
    setFase("sacude");
    track("regalo_calendario_intento");
    let res;
    try {
      [res] = await Promise.all([
        canjearRegalo(codigo, nombre, tel),
        new Promise((r) => setTimeout(r, 1300)), // la caja se sacude un momento
      ]);
    } catch {
      res = { ok: false, motivo: "error" };
    }
    if (!res.ok) {
      setFase("cerrada");
      setError(MOTIVOS[res.motivo] || MOTIVOS.error);
      return;
    }
    const p = { premio: res.premio, detalle: res.detalle || null, codigo: codigo.trim().toUpperCase() };
    try {
      localStorage.setItem(LS_REGALO, JSON.stringify(p));
    } catch {
      // sin localStorage
    }
    track("regalo_calendario_canjeado");
    setPremio(p);
    setFase("abierta");
  };

  return (
    <section
      className="rounded-2xl p-5 text-center shadow-2xl"
      style={{ background: "linear-gradient(160deg, #6E1219 0%, #8A1820 55%, #5A0F15 100%)", border: `2px solid ${DORADO}` }}
    >
      <style>{`
        @keyframes rsSacude { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-6deg)} 40%{transform:rotate(6deg)} 60%{transform:rotate(-4deg)} 80%{transform:rotate(4deg)} }
        .rs-sacude { animation: rsSacude .45s ease-in-out infinite; }
        @keyframes rsTapa { to { transform: translateY(-38px) rotate(-18deg); opacity: .0; } }
        .rs-tapa { animation: rsTapa .7s ease-out forwards; }
        @keyframes rsPremio { from { transform: scale(.6); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        .rs-premio { animation: rsPremio .6s .35s ease-out both; }
      `}</style>

      {premio ? (
        <>
          <Caja fase="abierta" />
          <p className="text-xs uppercase tracking-[0.25em] mt-2" style={{ color: DORADO }}>
            Tu regalo sorpresa
          </p>
          <div className="rs-premio">
            <p className="mt-1 text-3xl leading-tight" style={{ fontFamily: SERIF, color: CREMA }}>
              {premio.premio}
            </p>
            {premio.detalle && (
              <p className="mt-2 text-sm" style={{ color: "#f3e6e6" }}>
                {premio.detalle}
              </p>
            )}
            <p className="mt-3 text-sm" style={{ color: "#f3e6e6" }}>
              ¡Felicidades! Te escribo por WhatsApp para entregártelo.
            </p>
          </div>
        </>
      ) : (
        <>
          <Caja fase={fase} />
          <h2 className="mt-3 text-2xl sm:text-3xl leading-tight" style={{ fontFamily: SERIF, color: CREMA }}>
            Todos los calendarios traen un regalo sorpresa
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "#f3e6e6" }}>
            Adentro de tu calendario viene un código. Escríbelo aquí mismo y en ese momento descubres qué te
            tocó.
          </p>

          {!abierto ? (
            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="mt-4 w-full py-3 rounded-xl font-semibold"
              style={{ background: DORADO, color: VERDE_OSCURO }}
            >
              Ya tengo mi código
            </button>
          ) : (
            <form onSubmit={descubrir} className="mt-4 space-y-3 text-left">
              <label className="block">
                <span className="block text-sm font-semibold mb-1" style={{ color: CREMA }}>
                  Tu código
                </span>
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 14))}
                  placeholder="NAV-XXXXX"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="w-full rounded-lg px-4 py-3 text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#C9A24B] placeholder:text-gray-400 placeholder:font-normal"
                  style={CAMPO}
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-sm font-semibold mb-1" style={{ color: CREMA }}>
                    Tu nombre
                  </span>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value.slice(0, 80))}
                    autoComplete="name"
                    className="w-full rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
                    style={CAMPO}
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1" style={{ color: CREMA }}>
                    Tu WhatsApp
                  </span>
                  <input
                    value={tel}
                    onChange={(e) => setTel(e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 18))}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="10 dígitos"
                    className="w-full rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#C9A24B] placeholder:text-gray-400"
                    style={CAMPO}
                  />
                </label>
              </div>
              <p className="text-xs" style={{ color: "#f3e6e6" }}>
                Tu WhatsApp es para entregarte el regalo. Cada código se puede canjear una sola vez.
              </p>
              {error && (
                <p className="text-sm font-semibold rounded-lg px-3 py-2" style={{ background: "#FBF7EE", color: "#8A1820" }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={fase === "sacude" || !codigo.trim()}
                className="w-full py-3.5 rounded-xl font-semibold text-base disabled:opacity-60"
                style={{ background: DORADO, color: VERDE_OSCURO }}
              >
                {fase === "sacude" ? "Abriendo tu regalo…" : "Descubrir mi regalo"}
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
