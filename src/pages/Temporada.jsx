import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useParfums } from "../context/ParfumsContext";
import ProductCard from "../ui/ProductCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import SEO from "../ui/SEO";
import DecoracionTemporada from "../ui/DecoracionTemporada";
import { getTemporada, TEXTOS_TEMPORADA, puntajeTemporada } from "../functions/temporada";
import { esMismoPerfume } from "../functions/mismoPerfume";

// Tamaño de la selección: corta a propósito (es una curaduría, no un catálogo).
const MAX_COLECCION = 12;

// Colección de temporada: selección corta que se arma sola. Toma los
// perfumes disponibles con más notas "oscuras" (oud, cuero, incienso,
// vainilla…), uno por perfume (si hay decant y botella, el decant), hasta
// MAX_COLECCION. Se muestran como el catálogo: casa A-Z, precio y nombre.
export default function Temporada() {
  const { parfums = [], loading } = useParfums() || {};
  const temporada = getTemporada() || "halloween";
  const t = TEXTOS_TEMPORADA[temporada];

  const lista = useMemo(() => {
    const txt = (v) => (v ?? "").toString();
    const candidatos = parfums
      .filter((p) => p.disponible === "Disponible")
      .map((p) => ({ p, puntos: puntajeTemporada(p) }))
      .filter((x) => x.puntos >= 2)
      // Más notas oscuras primero; a empate, el decant (más accesible).
      .sort((a, b) => b.puntos - a.puntos || Number(a.p.stock) - Number(b.p.stock));
    const elegidos = [];
    for (const { p } of candidatos) {
      if (elegidos.length >= MAX_COLECCION) break;
      if (!elegidos.some((e) => esMismoPerfume(e, p))) elegidos.push(p);
    }
    return elegidos.sort(
        (a, b) =>
          txt(a.casa).localeCompare(txt(b.casa)) ||
          (Number(a.precio) || 0) - (Number(b.precio) || 0) ||
          txt(a.nombre).localeCompare(txt(b.nombre)),
      );
  }, [parfums]);

  return (
    <section className="bg-gray-100 py-10 min-h-screen">
      <SEO title={t.titulo} description={t.subtitulo} />
      <div className="relative -mt-10 pt-10 mb-8">
        <DecoracionTemporada />
      <div className="relative max-w-3xl mx-auto px-6 pt-2 text-center">
        <p className="text-sm tracking-[0.3em] uppercase mb-2" style={{ color: t.acento }}>
          Temporada
        </p>
        <h1 className="text-[#A47E3B] text-3xl sm:text-4xl font-extrabold">{t.titulo}</h1>
        <p className="text-gray-600 mt-3">{t.subtitulo}</p>
      </div>
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
