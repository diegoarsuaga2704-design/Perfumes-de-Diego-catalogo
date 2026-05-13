import { useState, useEffect } from "react";
import { useOutletContext, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../ui/Navbar";
import ProductGrid from "../ui/ProductGrid";

function Home() {
  const { searchResult } = useOutletContext();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();

  // Helper para resetear paginación cuando cambian filtros
  const resetPage = () => {
    console.log("🔵 resetPage llamado");
    setSearchParams(
      (prev) => {
        console.log("🔵 page antes:", prev.toString());
        const newParams = new URLSearchParams(prev);
        newParams.delete("page");
        console.log("🔵 page después:", newParams.toString());
        return newParams;
      },
      { replace: true }
    );
  };

  // Detecta el modo enviado desde Prehome
  const mode = location.state?.mode || "normal";

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

  // Aplicar filtro de casa solo cuando viene de /casas (selectedCasa en state).
  useEffect(() => {
    if (location.state?.selectedCasa) {
      setSelectedCasa(location.state.selectedCasa);
      setSelectedOcasion(null);
      setSelectedCategoria(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const handleSelectCasa = (value) => {
    console.log("🟡 handleSelectCasa:", value);
    setSelectedCasa(value);
    setSelectedOcasion(null);
    setSelectedCategoria(null);
    resetPage();
  };

  const handleSelectOcasion = (value) => {
    console.log("🟡 handleSelectOcasion:", value);
    setSelectedOcasion(value);
    setSelectedCasa(null);
    setSelectedCategoria(null);
    resetPage();
  };

  const handleSelectCategoria = (value) => {
    console.log("🟡 handleSelectCategoria:", value);
    setSelectedCategoria(value);
    setSelectedCasa(null);
    setSelectedOcasion(null);
    resetPage();
  };

  const handleSelectLimpiar = () => {
    setSelectedCategoria(null);
    setSelectedCasa(null);
    setSelectedOcasion(null);
    setStockFilter(null);
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
