import ProductCard from "./ProductCard";
import CotizarPerfume from "./CotizarPerfume";
import { useEffect, useState, useRef, useMemo } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { useOrder } from "../context/OrderContext.jsx";
import { useParfums } from "../context/ParfumsContext.jsx";
import Pagination from "./Paginacion.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import { normalizarTexto } from "../functions/normalizarTexto";
import { agruparFormatos, estadoGrupo } from "../functions/mismoPerfume";

// 🔒 Helper global para blindar strings
const safeString = (value) => (value ?? "").toString();

const DIAS_NUEVO = 7;
const esReciente = (p) => {
  if (!p.disponible_desde) return false;
  const dias = (new Date() - new Date(p.disponible_desde)) / (1000 * 60 * 60 * 24);
  return dias <= DIAS_NUEVO;
};

export default function ProductGrid({
  selectedCasa,
  selectedOcasion,
  selectedCategoria,
  onSelectLimpiar,
  searchResult,
  stockFilter,
  recientesFilter,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { parfums: allParfums, loading, error } = useParfums();
  const { order, comparar } = useOrder();

  // Paginación leída desde la URL para que sobreviva navegaciones POP
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const itemsPerPage = 36;
  const gridRef = useRef(null);

  // Cambio de página: actualiza URL con `replace` para no llenar el historial
  const setCurrentPage = (pageNumber) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        if (pageNumber <= 1) {
          newParams.delete("page");
        } else {
          newParams.set("page", String(pageNumber));
        }
        return newParams;
      },
      { replace: true }
    );
  };

  // Cuando el usuario cambia el orden, volver a página 1.
  // Robusto contra StrictMode: comparamos contra el valor previo del orden.
  const prevOrderRef = useRef(order);
  useEffect(() => {
    if (prevOrderRef.current !== order) {
      prevOrderRef.current = order;
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const filtradosPorFila = useMemo(() => {
    if (!allParfums || allParfums.length === 0) return [];
    // En Botellas no salen las botellas agotadas.
    const fuente =
      stockFilter === true
        ? allParfums.filter((p) => !(p.stock === true && p.disponible === "Agotado"))
        : allParfums;

    // ===== BUSQUEDA DIRECTA =====
    if (searchResult && searchResult.nombre) {
      let result = fuente.filter(
        (p) => normalizarTexto(p.nombre) === normalizarTexto(searchResult.nombre),
      );

      if (stockFilter !== null) {
        result = result.filter((p) => p.stock === stockFilter);
      }

      return result;
    }

    // ===== BUSQUEDA PARCIAL =====
    if (searchResult && searchResult.query) {
      const lowerQuery = normalizarTexto(searchResult.query);

      let result = fuente.filter(
        (p) =>
          normalizarTexto(p.nombre).includes(lowerQuery) ||
          normalizarTexto(p.casa).includes(lowerQuery),
      );

      if (stockFilter !== null) {
        result = result.filter((p) => p.stock === stockFilter);
      }

      // Mismo orden que eligió el cliente (casa + precio/nombre).
      return result.sort(comparar);
    }

    // ===== RECIÉN LLEGADOS =====
    if (recientesFilter) {
      return fuente
        .filter((p) => p.disponible === "Disponible" && esReciente(p))
        .sort(comparar);
    }

    // ===== FILTROS NORMALES =====
    let result = fuente.filter((p) => {
      const casaMatch =
        !selectedCasa ||
        safeString(p.casa).toLowerCase() === selectedCasa.toLowerCase();

      // Disponibilidad del perfume en conjunto (decant + botella).
      const ocasionMatch =
        !selectedOcasion ||
        safeString(estadoGrupo(p, allParfums)).toLowerCase() ===
          selectedOcasion.toLowerCase();

      const categoriaMatch =
        !selectedCategoria ||
        safeString(p.categoria).toLowerCase() ===
          selectedCategoria.toLowerCase();

      const stockMatch = stockFilter === null ? true : p.stock === stockFilter;

      return casaMatch && ocasionMatch && categoriaMatch && stockMatch;
    });

    // Orden combinado: casa (A-Z, Z-A o juntas) + precio o nombre.
    return result.sort(comparar);
  }, [
    allParfums,
    selectedCasa,
    selectedOcasion,
    selectedCategoria,
    comparar,
    searchResult,
    stockFilter,
    recientesFilter,
  ]);

  // Decant y botella del mismo perfume van en una sola tarjeta (en Decants o
  // Botellas solo hay un formato, así que no cambia nada ahí).
  const filteredParfums = useMemo(
    () => (stockFilter === null || stockFilter === undefined
      ? agruparFormatos(filtradosPorFila)
      : filtradosPorFila),
    [filtradosPorFila, stockFilter],
  );

  if (loading) return <LoadingSpinner />;

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredParfums.length / itemsPerPage),
  );
  const safePage = Math.min(currentPage, totalPages);
  const indexOfLastItem = safePage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentParfums = filteredParfums.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  return (
    <section className="bg-gray-100 py-12">
      <div className="max-w-12xl mx-auto sm:mx-8 lg:mx-12 px-6">
        <div className="mb-4 text-right space-x-3">
          {/* Solo con un filtro elegido por el cliente (en Decants/Botellas
              el tipo viene de la sección, no es un filtro que se pueda quitar). */}
          {(selectedCasa || selectedOcasion || selectedCategoria) && (
            <button
              onClick={onSelectLimpiar}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {filteredParfums.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-8">
            <p className="text-center text-gray-500 mb-6">
              {searchResult
                ? `No encontramos resultados para "${
                    searchResult.nombre || searchResult.query
                  }". Revisa la ortografía o intenta con otro término.`
                : "No hay perfumes que coincidan con los filtros seleccionados."}
            </p>
            <CotizarPerfume
              sugerencia={
                searchResult ? searchResult.nombre || searchResult.query : ""
              }
            />
          </div>
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
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          maxPageButtons={5}
          scrollRef={gridRef}
        />
      </div>
    </section>
  );
}