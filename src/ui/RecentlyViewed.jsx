import { useMemo } from "react";
import { getVistosIds } from "../functions/vistosRecientes";
import { useParfums } from "../context/ParfumsContext";
import ProductCard from "./ProductCard";

export default function RecentlyViewed({ excluirId }) {
  const { parfums } = useParfums();

  // Rehidrata los IDs guardados con los datos FRESCOS del contexto (precio y
  // disponibilidad actuales). Si un perfume ya no existe, se descarta.
  const vistos = useMemo(() => {
    const ids = getVistosIds(excluirId);
    return ids
      .map((id) => parfums.find((p) => String(p.id) === String(id)))
      .filter(Boolean)
      .slice(0, 4);
  }, [excluirId, parfums]);

  if (vistos.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">
        Vistos recientemente
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {vistos.map((parfum) => (
          <ProductCard key={parfum.id} parfum={parfum} />
        ))}
      </div>
    </section>
  );
}
