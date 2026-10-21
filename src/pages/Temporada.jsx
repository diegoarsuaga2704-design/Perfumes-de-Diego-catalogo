import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useParfums } from "../context/ParfumsContext";
import ProductCard from "../ui/ProductCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import SEO from "../ui/SEO";
import { getTemporada, TEXTOS_TEMPORADA, puntajeTemporada } from "../functions/temporada";

// Colección de temporada: se arma sola con los perfumes cuyas notas son
// "oscuras" (oud, cuero, incienso, vainilla…). Primero los disponibles y los
// que tienen más de esas notas.
export default function Temporada() {
  const { parfums = [], loading } = useParfums() || {};
  const temporada = getTemporada() || "halloween";
  const t = TEXTOS_TEMPORADA[temporada];

  const lista = useMemo(() => {
    const orden = { Disponible: 0, Próximamente: 1 };
    return parfums
      .filter((p) => p.disponible !== "Agotado")
      .map((p) => ({ p, puntos: puntajeTemporada(p) }))
      .filter((x) => x.puntos >= 2)
      .sort(
        (a, b) =>
          (orden[a.p.disponible] ?? 2) - (orden[b.p.disponible] ?? 2) || b.puntos - a.puntos,
      )
      .map((x) => x.p);
  }, [parfums]);

  return (
    <section className="bg-gray-100 py-10 min-h-screen">
      <SEO title={t.titulo} description={t.subtitulo} />
      <div className="max-w-3xl mx-auto px-6 text-center mb-8">
        <p className="text-sm tracking-[0.3em] uppercase mb-2" style={{ color: t.acento }}>
          Temporada
        </p>
        <h1 className="text-[#A47E3B] text-3xl sm:text-4xl font-extrabold">{t.titulo}</h1>
        <p className="text-gray-600 mt-3">{t.subtitulo}</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : lista.length === 0 ? (
        <p className="text-center text-gray-500">
          Pronto agrego perfumes a esta colección.{" "}
          <Link to="/home" className="text-[#A47E3B] hover:underline">
            Ver todo el catálogo
          </Link>
        </p>
      ) : (
        <div className="max-w-12xl mx-auto sm:mx-8 lg:mx-12 px-6 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-8">
          {lista.map((p) => (
            <ProductCard key={p.id} parfum={p} />
          ))}
        </div>
      )}
    </section>
  );
}
