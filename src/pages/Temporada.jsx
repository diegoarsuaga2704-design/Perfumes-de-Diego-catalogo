import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useParfums } from "../context/ParfumsContext";
import ProductCard from "../ui/ProductCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import SEO from "../ui/SEO";
import DecoracionTemporada from "../ui/DecoracionTemporada";
import {
  getTemporada,
  TEXTOS_TEMPORADA,
  puntajeTemporada,
  CASAS_COLECCION,
  esDeCasa,
} from "../functions/temporada";
import { esMismoPerfume } from "../functions/mismoPerfume";
import supabase from "../services/supabase";

// Tamaño de la selección: corta a propósito (es una curaduría, no un catálogo).
const MAX_COLECCION = 12;

// Colección de temporada. Si en el admin (/admin/temporada) elegiste
// perfumes, se muestran esos (sin los agotados). Si no hay ninguno elegido,
// se arma sola como selección corta (MAX_COLECCION): entran todos los
// disponibles de las casas "fijas" (Benneviento, Toskovat) y los lugares
// que falten se llenan alternando las casas de "relleno" (Filippo
// Sorcinelli, Ensar Oud), primero los de notas más oscuras. Uno por perfume
// (si hay decant y botella, el decant). Se muestran casa A-Z, precio, nombre.
export default function Temporada() {
  const { parfums = [], loading } = useParfums() || {};
  const temporada = getTemporada() || "halloween";
  const t = TEXTOS_TEMPORADA[temporada];

  // Perfumes elegidos a mano en el admin. Si la columna aún no existe o
  // falla la consulta, queda vacío y se usa la selección automática.
  const [elegidosAdmin, setElegidosAdmin] = useState(null);
  useEffect(() => {
    supabase
      .from("parfums")
      .select("id")
      .eq("en_temporada", true)
      .then(
        ({ data, error }) => setElegidosAdmin(error ? [] : (data || []).map((d) => d.id)),
        () => setElegidosAdmin([]),
      );
  }, []);

  const lista = useMemo(() => {
    const txt = (v) => (v ?? "").toString();
    const porCasa = (a, b) =>
      txt(a.casa).localeCompare(txt(b.casa)) ||
      (Number(a.precio) || 0) - (Number(b.precio) || 0) ||
      txt(a.nombre).localeCompare(txt(b.nombre));
    if (elegidosAdmin === null) return [];
    if (elegidosAdmin.length > 0) {
      const ids = new Set(elegidosAdmin);
      return parfums.filter((p) => ids.has(p.id) && p.disponible !== "Agotado").sort(porCasa);
    }
    // Disponibles; más notas oscuras primero y, a empate, el decant.
    const disponibles = parfums
      .filter((p) => p.disponible === "Disponible")
      .sort(
        (a, b) =>
          puntajeTemporada(b) - puntajeTemporada(a) || Number(a.stock) - Number(b.stock),
      );
    const elegidos = [];
    const agregar = (p) => {
      if (elegidos.length >= MAX_COLECCION) return false;
      if (elegidos.some((e) => e.id === p.id || esMismoPerfume(e, p))) return false;
      elegidos.push(p);
      return true;
    };
    for (const casa of CASAS_COLECCION.fijas) {
      disponibles.filter((p) => esDeCasa(p, casa)).forEach(agregar);
    }
    const colas = CASAS_COLECCION.relleno.map((casa) =>
      disponibles.filter((p) => esDeCasa(p, casa)),
    );
    while (elegidos.length < MAX_COLECCION && colas.some((c) => c.length)) {
      for (const cola of colas) {
        while (cola.length && !agregar(cola.shift())) {
          // salta repetidos
        }
      }
    }
    return elegidos.sort(porCasa);
  }, [parfums, elegidosAdmin]);

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

      {loading || elegidosAdmin === null ? (
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
