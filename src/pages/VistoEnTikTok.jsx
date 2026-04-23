import { useEffect, useState } from "react";
import { getPerfumesConTikTok } from "../functions/getParfums";
import ProductCard from "../ui/ProductCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import { FaTiktok } from "react-icons/fa";

function VistoEnTikTok() {
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getPerfumesConTikTok();
        // Ordenar por casa A-Z
        const ordenados = [...data].sort((a, b) => {
          const casaComparison = a.casa.localeCompare(b.casa);
          if (casaComparison !== 0) return casaComparison;
          return a.nombre.localeCompare(b.nombre);
        });
        setParfums(ordenados);
      } catch (err) {
        console.error(err);
        setError("Error al cargar los perfumes");
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
          <div className="flex items-center justify-center gap-2 mb-2">
            <FaTiktok className="text-[#A47E3B] text-3xl sm:text-4xl" />
            <h1 className="text-[#A47E3B] text-3xl sm:text-4xl font-extrabold">
              Visto en TikTok
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            Los perfumes de los que he hablado en mis videos
          </p>
        </div>

        {/* Link al perfil de TikTok */}
        <div className="text-center mb-8">
          <a
            href="https://www.tiktok.com/@perfumes_de_diego"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#A47E3B] hover:underline font-semibold"
          >
            <FaTiktok />
            Sígueme en @perfumes_de_diego
          </a>
        </div>

        {/* Grid */}
        {parfums.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            Próximamente tendremos los perfumes de mis videos aquí.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-8">
            {parfums.map((parfum) => (
              <ProductCard key={parfum.id} parfum={parfum} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default VistoEnTikTok;
