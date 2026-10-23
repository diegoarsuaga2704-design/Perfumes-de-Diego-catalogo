import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams, useParams, useNavigate } from "react-router-dom";
import { normalizarTexto } from "../functions/normalizarTexto";
import Navbar from "../ui/Navbar";
import ProductGrid from "../ui/ProductGrid";
import { useParfums } from "../context/ParfumsContext";
import { slugify } from "../functions/slugify";
import SEO from "../ui/SEO";

function Home({ forcedMode }) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug } = useParams();
  const { parfums } = useParfums();

  // Búsqueda desde la URL (?q=): sobrevive al abrir un perfume y regresar.
  // Si el texto es el nombre exacto de un perfume, muestra solo ese.
  const q = searchParams.get("q");
  const searchResult = useMemo(() => {
    if (!q) return null;
    const exacto = parfums.find((p) => normalizarTexto(p.nombre) === normalizarTexto(q));
    return exacto ? { nombre: exacto.nombre } : { query: q };
  }, [q, parfums]);
  const navigate = useNavigate();

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

  // Estados de filtros normales. Disponibilidad y categoría viven en la URL
  // (?disponible=...&categoria=...) para que sobrevivan al abrir un perfume
  // y regresar con "atrás". La casa vive en la ruta /casa/:slug.
  const [selectedCasa, setSelectedCasa] = useState(null);
  const selectedOcasion = searchParams.get("disponible");
  const selectedCategoria = searchParams.get("categoria");

  // Pone un solo filtro de URL (son excluyentes) y vuelve a la página 1.
  const setFiltroUrl = (clave, valor) => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("page");
        n.delete("disponible");
        n.delete("categoria");
        n.delete("q"); // elegir un filtro sale de la búsqueda
        if (clave && valor) n.set(clave, valor);
        return n;
      },
      { replace: true },
    );
  };

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

  const recientesFilter = forcedMode === "recientes";

  // Aplicar filtro de casa cuando viene de /casa/:slug.
  // Resuelve el slug contra las casas reales del catálogo.
  useEffect(() => {
    if (!slug) return;
    if (parfums.length === 0) return;

    const casasUnicas = [
      ...new Set(parfums.map((p) => p.casa).filter(Boolean)),
    ];
    const casaReal = casasUnicas.find((casa) => slugify(casa) === slug);

    if (casaReal) setSelectedCasa(casaReal);
  }, [slug, parfums]);

  const handleSelectCasa = (value) => {
    setSelectedCasa(value);
    navigate(`/casa/${slugify(value)}`);
  };

  // Desde /casa/:slug, elegir otro filtro sale de la casa (son excluyentes).
  const elegirFiltro = (clave, value) => {
    if (slug) {
      setSelectedCasa(null);
      navigate(`/home?${new URLSearchParams({ [clave]: value })}`);
    } else {
      setSelectedCasa(null);
      setFiltroUrl(clave, value);
    }
  };
  const handleSelectOcasion = (value) => elegirFiltro("disponible", value);
  const handleSelectCategoria = (value) => elegirFiltro("categoria", value);

  const handleSelectLimpiar = () => {
    setSelectedCasa(null);
    if (!forcedMode) {
      setStockFilter(null);
    }
    if (slug) {
      navigate("/home");
    } else {
      setFiltroUrl(null, null);
    }
  };

  // Título dinámico según la ruta
  const seoTitle = forcedMode === "stock"
    ? "Botellas completas y parciales"
    : forcedMode === "decants"
      ? "Decants de perfumes"
      : forcedMode === "recientes"
        ? "Recién Llegados"
        : slug
          ? `Perfumes de ${selectedCasa || slug}`
          : "Catálogo de perfumes";

  const seoDescription = forcedMode === "stock"
    ? "Perfumes sellados y parciales disponibles para enviar a todo México."
    : forcedMode === "decants"
      ? "Decants para que pruebes tus perfumes favoritos antes de comprar el frasco completo."
      : forcedMode === "recientes"
        ? "Los últimos perfumes que llegaron al catálogo. Novedades de la semana."
        : slug
          ? `Catálogo de perfumes de la casa ${selectedCasa || slug}. Decants y botellas disponibles.`
          : "Explora nuestro catálogo completo de decants y botellas de perfumes de nicho y de diseñador.";

  const currentUrl = `${window.location.origin}${location.pathname}`;

  return (
    <div>
      <SEO title={seoTitle} description={seoDescription} url={currentUrl} />
      <Navbar
        onSelectCasa={handleSelectCasa}
        onSelectOcasion={handleSelectOcasion}
        onSelectCategoria={handleSelectCategoria}
      />

      {q && (
        <p className="bg-gray-100 text-center text-sm text-gray-600 pt-4 px-4">
          Resultados para <strong className="text-gray-900">“{q}”</strong> ·{" "}
          <Link to="/home" className="text-[#A47E3B] hover:underline">
            Ver todo el catálogo
          </Link>
        </p>
      )}
      <ProductGrid
        selectedCasa={selectedCasa}
        selectedOcasion={selectedOcasion}
        selectedCategoria={selectedCategoria}
        onSelectLimpiar={handleSelectLimpiar}
        searchResult={searchResult}
        stockFilter={stockFilter}
        recientesFilter={recientesFilter}
      />
    </div>
  );
}

export default Home;
