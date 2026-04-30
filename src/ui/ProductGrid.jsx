import ProductCard from "./ProductCard";
import { useEffect, useState, useRef, useMemo } from "react";
import getParfums from "../functions/getParfums.jsx";
import LoadingSpinner from "./LoadingSpinner";
import { useOrder } from "../context/OrderContext.jsx";
import Pagination from "./Paginacion.jsx";
import { useNavigate } from "react-router-dom";

// 🔒 Helper global para blindar strings
const safeString = (value) => (value ?? "").toString();

export default function ProductGrid({
  selectedCasa,
  selectedOcasion,
  selectedCategoria,
  onSelectLimpiar,
  searchResult,
  stockFilter,
}) {
  const navigate = useNavigate();

  const [allParfums, setAllParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { order } = useOrder();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 36;
  const gridRef = useRef(null);

  // 🔧 Fetch + normalización de datos
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getParfums();

        // 🔒 Normalizar desde origen (clave)
        const cleanData = data.map((p) => ({
          ...p,
          nombre: p.nombre ?? "",
          casa: p.casa ?? "",
          precio: p.precio ?? 0,
          disponible: p.disponible ?? "",
          categoria: p.categoria ?? "",
        }));

        setAllParfums(cleanData);
      } catch (err) {
        console.error(err);
        setError("Error al cargar los perfumes");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredParfums = useMemo(() => {
    if (!allParfums || allParfums.length === 0) return [];

    // ===== BUSQUEDA DIRECTA =====
    if (searchResult && searchResult.nombre) {
      let result = allParfums.filter(
        (p) =>
          safeString(p.nombre).toLowerCase() ===
          safeString(searchResult.nombre).toLowerCase(),
      );

      if (stockFilter !== null) {
        result = result.filter((p) => p.stock === stockFilter);
      }

      return result;
    }

    // ===== BUSQUEDA PARCIAL =====
    if (searchResult && searchResult.query) {
      const lowerQuery = searchResult.query.toLowerCase();

      let result = allParfums.filter(
        (p) =>
          safeString(p.nombre).toLowerCase().includes(lowerQuery) ||
          safeString(p.casa).toLowerCase().includes(lowerQuery),
      );

      if (stockFilter !== null) {
        result = result.filter((p) => p.stock === stockFilter);
      }

      // 🔒 Sort blindado
      result = result.sort((a, b) => {
        const casaA = safeString(a.casa);
        const casaB = safeString(b.casa);

        const casaComparison = casaA.localeCompare(casaB);
        if (casaComparison !== 0) return casaComparison;

        return safeString(a.nombre).localeCompare(safeString(b.nombre));
      });

      return result;
    }

    // ===== FILTROS NORMALES =====
    let result = allParfums.filter((p) => {
      const casaMatch =
        !selectedCasa ||
        safeString(p.casa).toLowerCase() === selectedCasa.toLowerCase();

      const ocasionMatch =
        !selectedOcasion ||
        safeString(p.disponible).toLowerCase() ===
          selectedOcasion.toLowerCase();

      const categoriaMatch =
        !selectedCategoria ||
        safeString(p.categoria).toLowerCase() ===
          selectedCategoria.toLowerCase();

      const stockMatch = stockFilter === null ? true : p.stock === stockFilter;

      return casaMatch && ocasionMatch && categoriaMatch && stockMatch;
    });

    // 🔒 Ordenamiento completamente blindado
    result = result.sort((a, b) => {
      const nombreA = safeString(a.nombre);
      const nombreB = safeString(b.nombre);
      const casaA = safeString(a.casa);
      const casaB = safeString(b.casa);

      if (order === "nombre") {
        return nombreA.localeCompare(nombreB);
      }

      if (order === "casa") {
        const casaComparison = casaA.localeCompare(casaB);
        if (casaComparison !== 0) return casaComparison;
        return (a.precio ?? 0) - (b.precio ?? 0);
      }

      if (order === "precio") return (a.precio ?? 0) - (b.precio ?? 0);
      if (order === "precioMayor") return (b.precio ?? 0) - (a.precio ?? 0);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCasa, selectedOcasion, selectedCategoria, stockFilter]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

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