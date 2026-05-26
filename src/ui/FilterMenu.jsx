import { useState, useMemo } from "react";
import { useParfums } from "../context/ParfumsContext";
import MenuDesplegado from "./MenuDesplegado";

// 🔒 Helper para evitar null/undefined
const safeString = (v) => (v ?? "").toString();

export default function FilterMenu({
  onSelectCasa,
  onSelectOcasion,
  onSelectCategoria,
  selectedTipo,
  onSelectTipo,
  tipoFijo,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const { parfums } = useParfums();

  // 🔒 LIMPIEZA + UNIQUE + SORT SEGURO (a partir del catálogo ya cargado)
  const casasUnicas = useMemo(() => {
    return [...new Set(
      parfums
        .map((item) => safeString(item.casa))
        .filter((v) => v !== "")
    )].sort((a, b) => safeString(a).localeCompare(safeString(b)));
  }, [parfums]);

  const ocasionesUnicas = useMemo(() => {
    return [...new Set(
      parfums
        .map((item) => safeString(item.disponible))
        .filter((v) => v !== "")
    )].sort((a, b) => safeString(a).localeCompare(safeString(b)));
  }, [parfums]);

  const categoriasUnicas = useMemo(() => {
    return [...new Set(
      parfums
        .map((item) => safeString(item.categoria))
        .filter((v) => v !== "")
    )].sort((a, b) => safeString(a).localeCompare(safeString(b)));
  }, [parfums]);

  const toggleMenu = (menu) => {
    setOpenMenu((prevOpenMenu) =>
      prevOpenMenu === menu ? null : menu
    );
  };

  const handleSelectCasa = (nombreCasa) => {
    onSelectCasa(nombreCasa);
    setOpenMenu(null);
  };

  const handleSelectOcasion = (nombreOcasion) => {
    onSelectOcasion(nombreOcasion);
    setOpenMenu(null);
  };

  const handleSelectCategoria = (nombreCategoria) => {
    onSelectCategoria(nombreCategoria);
    setOpenMenu(null);
  };

  const tipoBtns = [
    { label: "Todos", value: null },
    { label: "Decant", value: false },
    { label: "Botella", value: true },
  ];

  return (
    <div className="relative flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-4">
      {!tipoFijo && onSelectTipo && (
        <div className="flex gap-1 items-center">
          {tipoBtns.map((btn) => (
            <button
              key={String(btn.value)}
              onClick={() => onSelectTipo(btn.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                selectedTipo === btn.value
                  ? "bg-[#A47E3B] text-white border-[#A47E3B]"
                  : "bg-white text-gray-700 border-gray-300 hover:border-[#A47E3B]"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      <MenuDesplegado
        menuType="casa"
        toggleMenu={toggleMenu}
        buttonName="Casa"
        openMenu={openMenu}
        array={casasUnicas}
        onSelectItem={handleSelectCasa}
      />

      <MenuDesplegado
        menuType="ocasion"
        toggleMenu={toggleMenu}
        buttonName="Disponible"
        openMenu={openMenu}
        array={ocasionesUnicas}
        onSelectItem={handleSelectOcasion}
        prioridad={{ Disponible: 1, Próximamente: 2, Agotado: 3 }}
      />

      <MenuDesplegado
        menuType="categoria"
        toggleMenu={toggleMenu}
        buttonName="Categoría"
        openMenu={openMenu}
        array={categoriasUnicas}
        onSelectItem={handleSelectCategoria}
        prioridad={{ Nicho: 1, Diseñador: 2, Árabe: 3 }}
      />
    </div>
  );
}