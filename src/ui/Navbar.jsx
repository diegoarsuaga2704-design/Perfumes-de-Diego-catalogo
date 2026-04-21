import FilterMenu from "./FilterMenu";
import OrdenarPor from "./OrdenarPor";
import ExternalsNavbar from "./extras/ExternalsNavbar";
import { NavLink } from "react-router-dom";
import { Flame } from "lucide-react";

export default function Navbar({
  onSelectCasa,
  onSelectOcasion,
  onSelectCategoria,
  onSelectLimpiar,
}) {
  return (
    <div className="bg-gray-200">
      {/* --- Order by --- */}
      <OrdenarPor />

      {/* --- Bottom Navigation --- */}
      <nav className="flex justify-between items-center sm:px-6 px-2 py-3 border-t border-gray-200 w-full gap-2">
        <FilterMenu
          onSelectCasa={onSelectCasa}
          onSelectOcasion={onSelectOcasion}
          onSelectCategoria={onSelectCategoria}
          onSelectLimpiar={onSelectLimpiar}
        />

        <NavLink
          to="/best-sellers"
          className="flex items-center text-xs sm:text-sm gap-2 bg-gradient-to-r from-[#A47E3B] to-[#D4AF7A] text-white sm:px-5 px-3 py-2 rounded-md hover:shadow-lg hover:scale-105 transition-all whitespace-nowrap font-semibold shadow-md"
        >
          <Flame className="sm:h-4 sm:w-4 h-3 w-3" />
          Mejor vendidos
        </NavLink>
      </nav>
    </div>
  );
}
