import FilterMenu from "./FilterMenu";
import OrdenarPor from "./OrdenarPor";

// Barra única: filtros a la izquierda y "Ordenar por" a la derecha.
// En celular, los filtros van en una línea y el orden en otra, compacta.
export default function Navbar({
  onSelectCasa,
  onSelectOcasion,
  onSelectCategoria,
  onSelectLimpiar,
  hayFiltros = false,
}) {
  return (
    <div className="bg-gray-200">
      <nav className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 sm:px-6 px-2 py-2 sm:py-3 w-full">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
          <FilterMenu
            onSelectCasa={onSelectCasa}
            onSelectOcasion={onSelectOcasion}
            onSelectCategoria={onSelectCategoria}
          />
          {hayFiltros && (
            <button
              onClick={onSelectLimpiar}
              className="text-sm font-semibold text-[#A47E3B] hover:underline px-1 py-1"
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
        <OrdenarPor />
      </nav>
    </div>
  );
}
