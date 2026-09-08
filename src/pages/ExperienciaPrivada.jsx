import { useEffect, useState } from "react";
import supabase from "../services/supabase";

const LS_VIP = "vip_sesion";

// Carga la tipografía Cormorant solo en esta página (no afecta el resto).
function useCormorant() {
  useEffect(() => {
    const id = "font-cormorant-vip";
    if (!document.getElementById(id)) {
      const l = document.createElement("link");
      l.id = id;
      l.rel = "stylesheet";
      l.href =
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap";
      document.head.appendChild(l);
    }
    // Fuera de Google (privada) + título propio.
    document.title = "Experiencia privada";
    const metaId = "robots-noindex-vip";
    if (!document.getElementById(metaId)) {
      const m = document.createElement("meta");
      m.id = metaId;
      m.name = "robots";
      m.content = "noindex,nofollow";
      document.head.appendChild(m);
    }
    return () => {
      const m = document.getElementById(metaId);
      if (m) m.remove();
    };
  }, []);
}

const SERIF = "'Cormorant Garamond', Georgia, serif";
const ORO = "#C6A15B";

export default function ExperienciaPrivada() {
  useCormorant();
  const [sesion, setSesion] = useState(null);
  const [username, setUsername] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_VIP);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.username) setSesion(d);
      }
    } catch {
      // ignora datos corruptos
    }
  }, []);

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
          telefono: cliente.telefono || "",
          saldo: Number(cliente.saldo) || 0,
        };
        localStorage.setItem(LS_VIP, JSON.stringify(nueva));
        setSesion(nueva);
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

  // Fondo con un halo dorado sutil para dar profundidad.
  const fondo = {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 50% -10%, rgba(198,161,91,0.10), transparent 60%), #0b0b0d",
    color: "#e8e4dc",
  };

  // ---------- Ya identificado (contenido real llega en la Fase 3) ----------
  if (sesion) {
    return (
      <div style={fondo} className="flex flex-col">
        <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
          <p
            className="uppercase text-xs tracking-[0.35em] mb-6"
            style={{ color: ORO }}
          >
            Experiencia privada
          </p>
          <h1
            className="text-4xl sm:text-5xl leading-tight"
            style={{ fontFamily: SERIF, color: "#f4efe6" }}
          >
            Bienvenido, {sesion.nombre}
          </h1>
          <div
            className="mt-8 inline-block border rounded-sm px-5 py-3"
            style={{ borderColor: "rgba(198,161,91,0.35)" }}
          >
            <span className="text-xs uppercase tracking-widest text-gray-400">
              Saldo disponible
            </span>
            <div
              className="text-2xl"
              style={{ fontFamily: SERIF, color: ORO }}
            >
              ${sesion.saldo.toLocaleString("es-MX")}
            </div>
          </div>

          <p className="mt-10 text-gray-500 text-sm" style={{ fontFamily: SERIF }}>
            (Aquí va el contenido de la experiencia y el agendado.)
          </p>

          <button
            onClick={salir}
            className="mt-12 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-300"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // ---------- Pantalla de acceso ----------
  return (
    <div style={fondo} className="flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center py-20">
        <div
          className="mx-auto mb-8 h-px w-16"
          style={{ background: ORO, opacity: 0.6 }}
        />
        <p
          className="uppercase text-xs tracking-[0.35em] mb-6"
          style={{ color: ORO }}
        >
          Experiencia privada
        </p>
        <h1
          className="text-4xl sm:text-5xl leading-tight"
          style={{ fontFamily: SERIF, color: "#f4efe6" }}
        >
          Acceso exclusivo
        </h1>
        <p
          className="mt-4 mb-10 text-gray-400"
          style={{ fontFamily: SERIF, fontSize: "1.15rem" }}
        >
          Ingresa tu clave de acceso personal para continuar.
        </p>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && entrar()}
          placeholder="Tu clave de acceso"
          className="w-full bg-transparent text-center text-lg tracking-wider py-3 px-4 outline-none"
          style={{
            color: "#f4efe6",
            border: "1px solid rgba(198,161,91,0.35)",
            borderRadius: 2,
          }}
        />

        <button
          onClick={entrar}
          disabled={verificando || !username.trim()}
          className="w-full mt-4 py-3 uppercase tracking-[0.2em] text-sm transition-colors disabled:opacity-40"
          style={{
            background: ORO,
            color: "#0b0b0d",
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          {verificando ? "Verificando…" : "Entrar"}
        </button>

        {error && (
          <p className="text-sm mt-5" style={{ color: "#d98c8c" }}>
            {error}
          </p>
        )}

        <div
          className="mx-auto mt-12 h-px w-16"
          style={{ background: ORO, opacity: 0.3 }}
        />
      </div>
    </div>
  );
}