import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBestSellers } from "../functions/getParfums";
import ProductCard from "../ui/ProductCard";
import LoadingSpinner from "../ui/LoadingSpinner";

function BestSellers() {
  const navigate = useNavigate();
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getBestSellers();
        // Ordenar por casa A-Z, y dentro de cada casa por nombre
        const ordenados = [...data].sort((a, b) => {
          const casaComparison = (a.casa || "").localeCompare(b.casa || "");
          if (casaComparison !== 0) return casaComparison;
          const precioA = Number(a.precio) || 0;
          const precioB = Number(b.precio) || 0;
          if (precioA !== precioB) return precioA - precioB;
          return (a.nombre || "").localeCompare(b.nombre || "");
        });
        setBestSellers(ordenados);
      } catch (err) {
        console.error(err);
        setError("Error al cargar los best sellers");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  return (
    <section className="bg-gray-100 py-12 min-h-screen">
      <div className="max-w-12xl mx-auto sm:mx-8 lg:mx-12 px-6">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h1 className="text-[#A47E3B] text-3xl sm:text-4xl font-extrabold mb-2">
            Mejor vendidos
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Los favoritos de nuestros clientes
          </p>
        </div>

        {/* Grid de productos o mensaje vacío */}
        {bestSellers.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            Próximamente tendremos nuestros best sellers aquí.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-8">
            {bestSellers.map((parfum) => (
              <ProductCard key={parfum.id} parfum={parfum} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default BestSellers;