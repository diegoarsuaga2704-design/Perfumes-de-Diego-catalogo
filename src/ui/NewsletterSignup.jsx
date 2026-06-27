import { useState } from "react";
import { Link } from "react-router-dom";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot anti-bot (debe quedar vacío)
  const [estado, setEstado] = useState("idle"); // idle | enviando | ok | error

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
      } else {
        setEstado("error");
      }
    } catch {
      setEstado("error");
    }
  };

  return (
    <section className="bg-[#2C2C2C] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 text-center">
        <h2 className="text-xl sm:text-2xl font-bold">
          Promos y nuevos perfumes, directo a tu correo
        </h2>
        <p className="mt-2 text-white/90 text-sm sm:text-base">
          Entérate primero de lanzamientos y ofertas. Sin spam.
        </p>

        {estado === "ok" ? (
          <p className="mt-5 font-semibold">¡Listo! Quedaste suscrito. 🎉</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-5 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            {/* Honeypot: oculto para personas, los bots lo llenan */}
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
              className="flex-1 px-4 py-3 rounded-md text-gray-800 focus:outline-none"
            />
            <button
              type="submit"
              disabled={estado === "enviando"}
              className="px-6 py-3 rounded-md bg-[#A47E3B] text-white font-semibold hover:bg-[#D4AF7A] active:bg-[#8B6A30] transition-colors whitespace-nowrap disabled:opacity-70"
            >
              {estado === "enviando" ? "Enviando..." : "Suscribirme"}
            </button>
          </form>
        )}

        {estado === "error" && (
          <p className="mt-3 text-sm font-medium">
            No se pudo suscribir. Intenta de nuevo en un momento.
          </p>
        )}

        <p className="mt-3 text-xs text-white/80">
          Al suscribirte aceptas recibir correos promocionales. Puedes darte de
          baja cuando quieras desde cualquier correo. Ver{" "}
          <Link to="/privacidad" className="underline">
            Aviso de Privacidad
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
