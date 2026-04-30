import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Selector personalizado con toda la fila clickeable y check a la derecha.
 * Reemplaza el <select> nativo del navegador.
 *
 * Props:
 *  - label: texto que aparece arriba del selector
 *  - value: valor actual seleccionado (number o null)
 *  - onChange: función que recibe el nuevo valor
 *  - options: array de objetos { value: number, label: string }
 *  - placeholder: texto cuando no hay valor seleccionado
 */
export default function CustomSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "-- Selecciona --",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Cerrar al hacer click fuera del componente
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Botón que abre el dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between border border-gray-300 rounded-md px-3 py-3 text-gray-800 bg-white shadow-sm hover:border-[#A47E3B] focus:ring-2 focus:ring-[#A47E3B] focus:border-[#A47E3B] transition duration-200 w-full"
      >
        <span className={selectedOption ? "text-gray-800" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown con opciones */}
      {isOpen && (
        <div className="relative">
          <div className="absolute top-1 left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-xl max-h-80 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                    isSelected
                      ? "bg-amber-50 text-[#A47E3B] font-semibold"
                      : "hover:bg-gray-50 text-gray-800"
                  }`}
                >
                  <span className="text-sm">{opt.label}</span>
                  {isSelected && (
                    <Check size={18} className="text-[#A47E3B]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
