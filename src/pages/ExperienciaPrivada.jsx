import { useEffect, useState } from "react";
import supabase from "../services/supabase";
import SEO from "../ui/SEO";

const LS_VIP = "vip_sesion";

export default function ExperienciaPrivada() {
  const [sesion, setSesion] = useState(null);
  const [username, setUsername] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState("");

  // Recupera la sesión VIP guardada (si ya se identificó antes).
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
        // Mensaje genérico: no revela si el usuario existe o no.
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

  // --- Ya identificado (contenido real llega en la Fase 3) ---
  if (sesion) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <SEO title="Experiencia privada" noindex />
        <p className="text-sm text-[#A47E3B] font-semibold uppercase tracking-wide">
          Experiencia privada
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          Bienvenido, {sesion.nombre}
        </h1>
        <p className="text-gray-600 mt-2">
          Tu saldo disponible: <strong>${sesion.saldo.toLocaleString("es-MX")}</strong>
        </p>
        <p className="text-gray-400 text-sm mt-6">
          (Aquí va el contenido de la experiencia y el agendado.)
        </p>
        <button
          onClick={salir}
          className="mt-8 text-sm text-gray-500 underline hover:text-gray-800"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  // --- Pantalla de acceso ---
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <SEO title="Experiencia privada" noindex />
      <p className="text-sm text-[#A47E3B] font-semibold uppercase tracking-wide text-center">
        Experiencia privada
      </p>
      <h1 className="text-2xl font-bold text-gray-900 mt-1 text-center">
        Acceso exclusivo
      </h1>
      <p className="text-gray-600 mt-2 mb-6 text-center">
        Ingresa tu clave de acceso personal para continuar.
      </p>

      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && entrar()}
        placeholder="Tu clave de acceso"
        className="w-full border border-gray-300 rounded-md px-4 py-3 text-center focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
      />

      <button
        onClick={entrar}
        disabled={verificando || !username.trim()}
        className="w-full mt-3 bg-[#A47E3B] text-white py-3 rounded-md font-semibold hover:bg-[#8b6d32] disabled:bg-gray-300"
      >
        {verificando ? "Verificando…" : "Entrar"}
      </button>

      {error && (
        <p className="text-sm text-red-600 text-center mt-4">{error}</p>
      )}
    </div>
  );
}