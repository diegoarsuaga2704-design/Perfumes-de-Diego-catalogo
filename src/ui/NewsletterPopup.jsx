import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";

// ⚙️ Ajustables:
const DELAY_MS = 18000; // ~18 s en la página antes de aparecer
const DIAS_REAPARECER = 7; // cada cuántos días vuelve a quien lo cerró
const KEY_VISTO = "popupNL_visto";
const KEY_SUSCRITO = "popupNL_suscrito";

export default function NewsletterPopup() {
  const location = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot anti-bot
  const [estado, setEstado] = useState("idle"); // idle | enviando | ok | error

  // Decide si mostrarlo y lo abre tras el retardo
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return; // no molestar en admin

    let mostrar = true;
    try {
      if (localStorage.getItem(KEY_SUSCRITO)) mostrar = false;
      const visto = Number(localStorage.getItem(KEY_VISTO) || 0);
      const ms = DIAS_REAPARECER * 24 * 60 * 60 * 1000;
      if (Date.now() - visto < ms) mostrar = false;
    } catch {
      // si localStorage falla, lo mostramos de todos modos
    }
    if (!mostrar) return;

    const t = setTimeout(() => {
      setAbierto(true);
      try {
        localStorage.setItem(KEY_VISTO, String(Date.now()));
      } catch {}
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, [location.pathname]);

  // Cerrar con Escape
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  const cerrar = () => setAbierto(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (estado === "enviando") return;
    setEstado("enviando");
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, hp }),
      });
      if (r.ok) {
        setEstado("ok");
        setEmail("");
        try {
          localStorage.setItem(KEY_SUSCRITO, "1");
        } catch {}
      } else {
        setEstado("error");
      }
    } catch {
      setEstado("error");
    }
  };

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60"
      onClick={cerrar}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
        >
          <X size={22} />
        </button>

        {estado === "ok" ? (
          <div className="py-4">
            <p className="text-lg font-bold text-gray-900">
              ¡Listo! Quedaste suscrito 🎉
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Te enviamos tu cupón de <strong>10% en decants</strong> a tu
              correo. Revisa tu bandeja (y la carpeta de spam).
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Es de un solo uso por persona. Aplícalo en tu carrito al pedir.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900">
              10% en tu primer pedido de decants
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Suscríbete y te enviamos por correo un cupón de 10% en decants —{" "}
              <strong>un solo uso por persona</strong>. Y entérate de novedades
              antes que nadie. Sin spam.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
              <input
                type="text"
                name="website"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tucorreo@ejemplo.com"
                className="w-full px-4 py-3 rounded-md border border-gray-300 text-gray-800 focus:outline-none focus:border-[#A47E3B]"
              />
              <button
                type="submit"
                disabled={estado === "enviando"}
                className="w-full px-6 py-3 rounded-md bg-[#A47E3B] text-white font-semibold hover:bg-[#D4AF7A] active:bg-[#8B6A30] transition-colors disabled:opacity-70"
              >
                {estado === "enviando" ? "Enviando..." : "Quiero mi 10%"}
              </button>
            </form>

            {estado === "error" && (
              <p className="mt-3 text-sm text-red-600">
                No se pudo suscribir. Intenta de nuevo en un momento.
              </p>
            )}

            <p className="mt-3 text-xs text-gray-400">
              Al suscribirte aceptas recibir correos promocionales. Puedes darte
              de baja cuando quieras. Ver{" "}
              <Link to="/privacidad" className="underline" onClick={cerrar}>
                Aviso de Privacidad
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
