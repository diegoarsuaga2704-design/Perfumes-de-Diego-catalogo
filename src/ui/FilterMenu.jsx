import { useState, useEffect } from "react";
import supabase from "../services/supabase";
import MenuDesplegado from "./MenuDesplegado";

// 🔒 Helper para evitar null/undefined
const safeString = (v) => (v ?? "").toString();

export default function FilterMenu({
  onSelectCasa,
  onSelectOcasion,
  onSelectCategoria,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const [casas, setCasas] = useState([]);
  const [ocasiones, setOcasiones] = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const { data: casasData } = await supabase.from("parfums").select("casa");
      const { data: ocasionesData } = await supabase
        .from("parfums")
        .select("disponible");
      const { data: categoriasData } = await supabase
        .from("parfums")
        .select("categoria");

      setCasas(casasData || []);
      setOcasiones(ocasionesData || []);
      setCategorias(categoriasData || []);
    }
    fetchData();
  }, []);

  // 🔒 LIMPIEZA + UNIQUE + SORT SEGURO

  const casasUnicas = [...new Set(
    casas
      .map((item) => safeString(item.casa))
      .filter((v) => v !== "")
  )].sort((a, b) => safeString(a).localeCompare(safeString(b)));

  const ocasionesUnicas = [...new Set(
    ocasiones
      .map((item) => safeString(item.disponible))
      .filter((v) => v !== "")
  )].sort((a, b) => safeString(a).localeCompare(safeString(b)));

  const categoriasUnicas = [...new Set(
    categorias
      .map((item) => safeString(item.categoria))
      .filter((v) => v !== "")
  )].sort((a, b) => safeString(a).localeCompare(safeString(b)));

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

  return (
    <div className="relative flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-4">
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