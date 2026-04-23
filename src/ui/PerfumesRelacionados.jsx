import { useEffect, useState } from "react";
import { getRelacionados } from "../functions/getParfums";
import ProductCard from "./ProductCard";

function PerfumesRelacionados({ casa, excluirId }) {
  const [relacionados, setRelacionados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getRelacionados(casa, excluirId);
      setRelacionados(data);
      setLoading(false);
    }
    if (casa && excluirId) {
      fetchData();
    }
  }, [casa, excluirId]);

  // No renderizar nada si no hay relacionados
  if (loading) return null;
  if (relacionados.length === 0) return null;

  return (
    <section className="bg-gray-50 py-10 sm:py-14 px-4 sm:px-6 border-t border-gray-200">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[#A47E3B] text-xl sm:text-2xl font-extrabold mb-6 text-center">
          Más perfumes de {casa}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {relacionados.map((parfum) => (
            <ProductCard key={parfum.id} parfum={parfum} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PerfumesRelacionados;