import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import getParfums from "../functions/getParfums";
import { useNavigate } from "react-router-dom";

function SearchBar({ onSearchResult }) {
  // Estados para manejar datos, carga y errores
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [parfums, setParfums] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const containerRef = useRef(null); //

  // Llamada a la API cuando el componente se monta
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getParfums();
        // Ordenamos alfabéticamente por nombre
        setParfums(data);
      } catch (err) {
        console.error(err);
        setError("Error al cargar los perfumes");
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (query.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      onSearchResult(parfums);
      return;
    }

    const lowerQuery = query.toLowerCase();
    // Separar en dos grupos:
    // 1️⃣ los que empiezan con el texto
    const startsWithMatches = parfums.filter(
      (p) =>
        p.nombre.toLowerCase().startsWith(lowerQuery) ||
        p.casa.toLowerCase().startsWith(lowerQuery),
    );
    // 2️⃣ los que contienen el texto pero no empiezan con él
    const containsMatches = parfums.filter(
      (p) =>
        !p.nombre.toLowerCase().startsWith(lowerQuery) &&
        p.nombre.toLowerCase().includes(lowerQuery),
    );
    // Combinar ambos, priorizando los que empiezan igual
    const orderedSuggestions = [...startsWithMatches, ...containsMatches];
    // Mostrar máximo 5 sugerencias
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

  const handleSelect = (nombre) => {
    setQuery(nombre);
    setShowSuggestions(false);

    // Enviar el resultado completo al padre
    const selected = parfums.find(
      (p) => p.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    if (selected) {
      onSearchResult(selected);
      navigate("/home");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSelect(query);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    onSearchResult(parfums);
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
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full px-4 pr-10 py-2 focus:outline-none text-sm h-10 rounded-l-md border border-gray-300 text-gray-800"
            onFocus={() => setShowSuggestions(true)}
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
                handleSelect(item.nombre);
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
