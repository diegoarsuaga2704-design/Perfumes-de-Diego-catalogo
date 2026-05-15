import { useState, useRef, useEffect } from "react";
import { useParfums } from "../context/ParfumsContext";

export default function CasaAutocomplete({
  value,
  onChange,
  className = "",
  placeholder = "Ej: Creed",
}) {
  const { parfums } = useParfums();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  // Lista de casas únicas del catálogo, ordenadas
  const casasUnicas = [
    ...new Set(parfums.map((p) => p.casa).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  // Filtrar sugerencias por lo que se está escribiendo
  const sugerencias =
    value && value.trim()
      ? casasUnicas.filter((c) =>
          c.toLowerCase().includes(value.toLowerCase())
        )
      : casasUnicas;

  // Cerrar sugerencias al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Al perder foco: si lo escrito coincide case-insensitive con una casa
  // existente, normalizar a la capitalización canónica
  const handleBlur = () => {
    if (value && value.trim()) {
      const match = casasUnicas.find(
        (c) => c.toLowerCase() === value.toLowerCase().trim(),
      );
      if (match && match !== value.trim()) {
        onChange(match);
      } else if (value !== value.trim()) {
        onChange(value.trim());
      }
    }
  };

  const handleSelectSuggestion = (casa) => {
    onChange(casa);
    setShowSuggestions(false);
  };

  // ¿La casa escrita ya existe (case-insensitive)?
  const yaExiste =
    value &&
    value.trim() &&
    casasUnicas.some(
      (c) => c.toLowerCase() === value.toLowerCase().trim(),
    );

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {showSuggestions && sugerencias.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {sugerencias.map((casa) => {
            const esMatchExacto =
              casa.toLowerCase() === (value || "").toLowerCase().trim();
            return (
              <li
                key={casa}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(casa);
                }}
                className={`px-3 py-2 text-sm cursor-pointer ${
                  esMatchExacto
                    ? "bg-amber-50 text-[#A47E3B] font-semibold"
                    : "hover:bg-gray-100"
                }`}
              >
                {casa}
              </li>
            );
          })}
        </ul>
      )}

      {/* Aviso de "casa nueva" si lo escrito no coincide con ninguna */}
      {value && value.trim() && !yaExiste && (
        <p className="text-xs text-amber-700 mt-1">
          Se creará una casa nueva: "{value.trim()}"
        </p>
      )}
    </div>
  );
}