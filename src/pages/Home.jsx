import { useState, useEffect } from "react";
import { useOutletContext, useLocation, useSearchParams, useParams, useNavigate } from "react-router-dom";
import Navbar from "../ui/Navbar";
import ProductGrid from "../ui/ProductGrid";
import { useParfums } from "../context/ParfumsContext";
import { slugify } from "../functions/slugify";
import SEO from "../ui/SEO";

function Home({ forcedMode }) {
  const { searchResult } = useOutletContext();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const { slug } = useParams();
  const { parfums } = useParfums();
  const navigate = useNavigate();

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
    navigate(`/casa/${slugify(value)}`);
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
    setSelectedCasa(null);
    if (!forcedMode) {
      setStockFilter(null);
    }
    if (slug) {
      navigate("/home");
    } else {
      resetPage();
    }
  };

  // Título dinámico según la ruta
  const seoTitle = forcedMode === "stock"
    ? "Botellas completas y parciales"
    : forcedMode === "decants"
      ? "Decants de perfumes"
      : slug
        ? `Perfumes de ${selectedCasa || slug}`
        : "Catálogo de perfumes";

  const seoDescription = forcedMode === "stock"
    ? "Perfumes sellados y parciales disponibles para enviar a todo México."
    : forcedMode === "decants"
      ? "Decants para que pruebes tus perfumes favoritos antes de comprar el frasco completo."
      : slug
        ? `Catálogo de perfumes de la casa ${selectedCasa || slug}. Decants y botellas disponibles.`
        : "Explora nuestro catálogo completo de decants y botellas de perfumes de nicho y de diseñador.";

  return (
    <div>
      <SEO title={seoTitle} description={seoDescription} />
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
