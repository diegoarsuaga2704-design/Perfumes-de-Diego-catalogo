import { useState, useEffect } from "react";
import { useOutletContext, useLocation, useSearchParams, useParams } from "react-router-dom";
import Navbar from "../ui/Navbar";
import ProductGrid from "../ui/ProductGrid";
import { useParfums } from "../context/ParfumsContext";
import { slugify } from "../functions/slugify";

function Home({ forcedMode }) {
  const { searchResult } = useOutletContext();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const { slug } = useParams();
  const { parfums } = useParfums();

  // Helper para resetear paginación cuando cambian filtros
  const resetPage = () => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete("page");
        return newParams;
      },
      { replace: true }
    );
  };

  // Detecta el modo. Prioridad:
  // 1. forcedMode (prop) — viene de las rutas /botellas y /decants
  // 2. location.state.mode (legacy, por compatibilidad)
  // 3. "normal" — catálogo completo
  const mode = forcedMode || location.state?.mode || "normal";

  // Estado para activar filtro exclusivo de stock
  const [stockFilter, setStockFilter] = useState(null);
  // null = mostrar todo
  // true = solo stock
  // false = solo decants

  // Estados de filtros normales
  const [selectedCasa, setSelectedCasa] = useState(null);
  const [selectedOcasion, setSelectedOcasion] = useState(null);
  const [selectedCategoria, setSelectedCategoria] = useState(null);

  // Aplicar el modo (stock/decants) solo cuando realmente cambia, no en cada montaje
  useEffect(() => {
    if (mode === "stock") {
      setStockFilter(true);
    } else if (mode === "decants") {
      setStockFilter(false);
    } else {
      setStockFilter(null);
    }
  }, [mode]);

  // Aplicar filtro de casa cuando viene de /casa/:slug.
  // Resuelve el slug contra las casas reales del catálogo.
  useEffect(() => {
    if (!slug) return;
    if (parfums.length === 0) return;

    const casasUnicas = [
      ...new Set(parfums.map((p) => p.casa).filter(Boolean)),
    ];
    const casaReal = casasUnicas.find((casa) => slugify(casa) === slug);

    if (casaReal) {
      setSelectedCasa(casaReal);
      setSelectedOcasion(null);
      setSelectedCategoria(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, parfums]);

  const handleSelectCasa = (value) => {
    setSelectedCasa(value);
    setSelectedOcasion(null);
    setSelectedCategoria(null);
    resetPage();
  };

  const handleSelectOcasion = (value) => {
    setSelectedOcasion(value);
    setSelectedCasa(null);
    setSelectedCategoria(null);
    resetPage();
  };

  const handleSelectCategoria = (value) => {
    setSelectedCategoria(value);
    setSelectedCasa(null);
    setSelectedOcasion(null);
    resetPage();
  };

  const handleSelectLimpiar = () => {
    setSelectedCategoria(null);
    setSelectedOcasion(null);
    // Si la ruta fuerza casa (/casa/:slug), mantener selectedCasa para
    // que siga coherente con la URL.
    if (!slug) {
      setSelectedCasa(null);
    }
    // Si la ruta fuerza un modo (/botellas, /decants), mantener su stockFilter.
    if (!forcedMode) {
      setStockFilter(null);
    }
    resetPage();
  };

  return (
    <div>
      <Navbar
        onSelectCasa={handleSelectCasa}
        onSelectOcasion={handleSelectOcasion}
        onSelectCategoria={handleSelectCategoria}
      />

      <ProductGrid
        selectedCasa={selectedCasa}
        selectedOcasion={selectedOcasion}
        selectedCategoria={selectedCategoria}
        onSelectLimpiar={handleSelectLimpiar}
        searchResult={searchResult}
        stockFilter={stockFilter}
      />
    </div>
  );
}

export default Home;
