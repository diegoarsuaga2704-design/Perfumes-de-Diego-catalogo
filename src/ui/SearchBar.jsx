import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useParfums } from "../context/ParfumsContext";
import { useNavigate } from "react-router-dom";
import { slugify } from "../functions/slugify";

function SearchBar({ onSearchResult }) {
  const { parfums, error } = useParfums();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (query.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      onSearchResult(null);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const safeLower = (v) => (v ?? "").toString().toLowerCase();
    // Separar en dos grupos:
    // 1️⃣ los que empiezan con el texto
    const startsWithMatches = parfums.filter(
      (p) =>
        safeLower(p.nombre).startsWith(lowerQuery) ||
        safeLower(p.casa).startsWith(lowerQuery),
    );
    // 2️⃣ los que contienen el texto pero no empiezan con él
    const containsMatches = parfums.filter(
      (p) =>
        !safeLower(p.nombre).startsWith(lowerQuery) &&
        safeLower(p.nombre).includes(lowerQuery),
    );
    // Combinar ambos, priorizando los que empiezan igual
    const orderedSuggestions = [...startsWithMatches, ...containsMatches];
    // Mostrar máximo 20 sugerencias
    setSuggestions(orderedSuggestions.slice(0, 20));
    setShowSuggestions(true);
  }, [query, parfums, onSearchResult]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (item) => {
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.blur();
    navigate(`/product/${slugify(item.nombre)}/${item.id}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // ¿Hay un perfume con ese nombre exacto?
    const exactMatch = parfums.find(
      (p) => (p.nombre ?? "").toString().toLowerCase() === query.toLowerCase(),
    );

    if (exactMatch) {
      // Coincidencia exacta: comportamiento de siempre
      onSearchResult(exactMatch);
    } else {
      // No hay exacta: búsqueda parcial
      onSearchResult({ query: query.trim() });
    }

    setShowSuggestions(false);
    inputRef.current?.blur();
    navigate("/home");
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    onSearchResult(null);
  };

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full sm:w-[500px] my-3 sm:mt-0"
    >
      <form onSubmit={handleSubmit} className="flex items-center w-full">
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full px-4 pr-10 py-2 focus:outline-none text-sm h-10 rounded-l-md border border-gray-300 text-gray-800"
            onFocus={() => {
              setShowSuggestions(true);
              // En mobile, esperar a que aparezca el teclado virtual y
              // scrollear el input al top para que las sugerencias queden
              // visibles. En desktop el efecto es imperceptible.
              setTimeout(() => {
                inputRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 300);
            }}
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          className="bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-4 py-2 rounded-r-md flex items-center justify-center h-10"
        >
          <Search size={18} />
        </button>
      </form>

      {/* Lista de sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-md max-h-60 overflow-y-auto">
          {suggestions.map((item) => (
            <li
              key={item.id}
              className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
              onMouseDown={(e) => {
                e.preventDefault(); // evita que el input pierda foco antes del click
                handleSelect(item);
                setTimeout(() => {
                  setShowSuggestions(false);
                }, 0); // permite que React actualice antes de cerrar la lista
              }}
            >
              <img
                src={item.image}
                alt={item.nombre}
                className="h-7 rounded object-cover mr-3"
              />
              <span className="text-sm text-gray-600">{item.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;
