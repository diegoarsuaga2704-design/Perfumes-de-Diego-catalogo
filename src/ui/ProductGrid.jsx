import ProductCard from "./ProductCard";
import { useEffect, useState, useRef, useMemo } from "react";
import getParfums from "../functions/getParfums";
import LoadingSpinner from "./LoadingSpinner";
import { useOrder } from "../context/OrderContext.jsx";
import Pagination from "./Paginacion.jsx";
import { useNavigate } from "react-router-dom";

export default function ProductGrid({
  selectedCasa,
  selectedOcasion,
  selectedCategoria,
  onSelectLimpiar,
  searchResult,
  stockFilter,
}) {
  const navigate = useNavigate();

  // Estados para manejar datos, carga y errores
  const [allParfums, setAllParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { order } = useOrder();

  // Estados para la paginacion
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 36;
  const gridRef = useRef(null);

  // Llamada a la API cuando el componente se monta
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getParfums();
        setAllParfums(data);
      } catch (err) {
        console.error(err);
        setError("Error al cargar los perfumes");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // FILTRADO PRINCIPAL
  const filteredParfums = useMemo(() => {
    if (!allParfums || allParfums.length === 0) return [];

    // ===== BUSQUEDA DIRECTA (eligió una sugerencia del autocomplete) =====
    if (searchResult && searchResult.nombre) {
      let result = allParfums.filter(
        (p) => p.nombre.toLowerCase() === searchResult.nombre.toLowerCase(),
      );

      if (stockFilter !== null) {
        result = result.filter((p) => p.stock === stockFilter);
      }

      return result;
    }

    // ===== BUSQUEDA PARCIAL (escribió y presionó Enter) =====
    if (searchResult && searchResult.query) {
      const lowerQuery = searchResult.query.toLowerCase();
      let result = allParfums.filter(
        (p) =>
          p.nombre.toLowerCase().includes(lowerQuery) ||
          p.casa.toLowerCase().includes(lowerQuery),
      );

      if (stockFilter !== null) {
        result = result.filter((p) => p.stock === stockFilter);
      }

      // Ordenar por casa A-Z, luego por nombre dentro de cada casa
      result = result.sort((a, b) => {
        const casaComparison = a.casa.localeCompare(b.casa);
        if (casaComparison !== 0) return casaComparison;
        return a.nombre.localeCompare(b.nombre);
      });

      return result;
    }

    // ===== FILTROS NORMALES =====
    let result = allParfums.filter((p) => {
      const casaMatch =
        !selectedCasa || p.casa?.toLowerCase() === selectedCasa.toLowerCase();

      const ocasionMatch =
        !selectedOcasion ||
        p.disponible?.toLowerCase() === selectedOcasion.toLowerCase();

      const categoriaMatch =
        !selectedCategoria ||
        p.categoria?.toLowerCase() === selectedCategoria.toLowerCase();

      // 🔹 FILTRO GLOBAL DE STOCK
      const stockMatch = stockFilter === null ? true : p.stock === stockFilter;

      return casaMatch && ocasionMatch && categoriaMatch && stockMatch;
    });

    // ===== ORDENAMIENTO =====
    result = result.sort((a, b) => {
      if (order === "nombre") return a.nombre.localeCompare(b.nombre);

      if (order === "casa") {
        const casaComparison = a.casa.localeCompare(b.casa);
        if (casaComparison !== 0) return casaComparison;
        return a.precio - b.precio;
      }

      if (order === "precio") return a.precio - b.precio;
      if (order === "precioMayor") return b.precio - a.precio;

      return 0;
    });

    return result;
  }, [
    allParfums,
    selectedCasa,
    selectedOcasion,
    selectedCategoria,
    order,
    searchResult,
    stockFilter,
  ]);

  // Reiniciar página cuando cambian filtros o modo stock
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCasa, selectedOcasion, selectedCategoria, stockFilter]);

  // Estado de carga
  if (loading) return <LoadingSpinner />;

  // Estado de error
  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  // ===== PAGINACION =====
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentParfums = filteredParfums.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const totalPages = Math.ceil(filteredParfums.length / itemsPerPage);

  return (
    <section className="bg-gray-100 py-12">
      <div className="max-w-12xl mx-auto sm:mx-8 lg:mx-12 px-6">
        {/* Botón Limpiar filtros */}
        <div className="mb-4 text-right space-x-3">
          {(selectedCasa ||
            selectedOcasion ||
            selectedCategoria ||
            stockFilter !== null) && (
            <button
              onClick={onSelectLimpiar}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Limpiar filtros
            </button>
          )}

          
        </div>
        {filteredParfums.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            No hay perfumes que coincidan con los filtros seleccionados.
          </p>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-8"
          >
            {currentParfums.map((parfum) => (
              <ProductCard key={parfum.id} parfum={parfum} />
            ))}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          maxPageButtons={5}
          scrollRef={gridRef}
        />
      </div>
    </section>
  );
}
