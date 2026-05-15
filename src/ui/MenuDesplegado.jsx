import { useEffect, useRef } from "react";
import { Menu, ChevronDown } from "lucide-react";

function MenuDesplegado({
  toggleMenu,
  menuType,
  buttonName,
  openMenu,
  array,
  onSelectItem,
  prioridad,
}) {
  const arrayOrdenado = prioridad
    ? [...array].sort((a, b) => (prioridad[a] || 99) - (prioridad[b] || 99))
    : [...array].sort((a, b) => a.localeCompare(b));

  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el clic fue fuera del menú y fuera del botón
      if (
        openMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        toggleMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenu, toggleMenu]);

  // Centrar el dropdown en pantalla al abrirlo (útil en móvil)
  useEffect(() => {
    if (openMenu === menuType && menuRef.current) {
      const timer = setTimeout(() => {
        menuRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [openMenu, menuType]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => toggleMenu(menuType)}
        className="flex items-center text-xs sm:text-sm gap-2 bg-[#A47E3B] text-white sm:px-4 px-1 py-2 rounded-md hover:bg-[#D4AF7A] transition-colors"
      >
        <Menu className="sm:h-4 sm:w-4 h-3 w-3" />
        {buttonName}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            openMenu === menuType ? "rotate-180" : ""
          }`}
        />
      </button>

      {openMenu === menuType && (
        <div
          ref={menuRef}
          className="absolute mt-2 bg-white shadow-lg rounded-md border border-gray-200 w-40 sm:w-48 z-20 max-h-64 overflow-y-auto"
        >
          {array.length > 0 ? (
            arrayOrdenado.map((item, index) => (
              <div
                key={index}
                onClick={() => onSelectItem(item)}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer border-t border-gray-100"
              >
                {item}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">Sin datos</div>
          )}
        </div>
      )}
    </div>
  );
}

export default MenuDesplegado;
