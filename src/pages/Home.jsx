import { useState, useEffect } from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import Navbar from "../ui/Navbar";
import ProductGrid from "../ui/ProductGrid";

function Home() {
  const { searchResult } = useOutletContext();
  const location = useLocation();

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

  // Activar filtro de stock si se entra desde "Stock disponible"
  useEffect(() => {
    if (mode === "stock") {
      setStockFilter(true);
    } else if (mode === "decants") {
      setStockFilter(false);
    } else {
      setStockFilter(null);
    }
  }, [mode]);

  const handleSelectCasa = (value) => {
    setSelectedCasa(value);
    setSelectedOcasion(null);
    setSelectedCategoria(null);
  };

  const handleSelectOcasion = (value) => {
    setSelectedOcasion(value);
    setSelectedCasa(null);
    setSelectedCategoria(null);
  };

  const handleSelectCategoria = (value) => {
    setSelectedCategoria(value);
    setSelectedCasa(null);
    setSelectedOcasion(null);
  };

  const handleSelectLimpiar = () => {
    setSelectedCategoria(null);
    setSelectedCasa(null);
    setSelectedOcasion(null);
    setStockFilter(null);
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
