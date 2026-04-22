import FilterMenu from "./FilterMenu";
import OrdenarPor from "./OrdenarPor";
import ExternalsNavbar from "./extras/ExternalsNavbar";

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
      <nav className="flex sm:px-6 px-2 py-3 border-t border-gray-200 w-full">
        <FilterMenu
          onSelectCasa={onSelectCasa}
          onSelectOcasion={onSelectOcasion}
          onSelectCategoria={onSelectCategoria}
          onSelectLimpiar={onSelectLimpiar}
        />
      </nav>
    </div>
  );
}
