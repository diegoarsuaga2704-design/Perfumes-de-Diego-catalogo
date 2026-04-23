import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

function MainMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const categorias = [
    {
      nombre: "Decants",
      accion: () => navigate("/home", { state: { mode: "decants" } }),
    },
    {
      nombre: "Botellas",
      accion: () => navigate("/home", { state: { mode: "stock" } }),
    },
    {
      nombre: "Mejor vendidos",
      accion: () => navigate("/best-sellers"),
    },
    {
      nombre: "Visto en TikTok",
      accion: () => navigate("/tiktok"),
    },

    {
      nombre: "Paquetes",
      accion: () => {
        window.open(
          "https://wa.me/5212212034647?text=" +
            encodeURIComponent(
              "Hola Diego, me interesan los paquetes de perfumes",
            ),
          "_blank",
        );
      },
    },
  ];

  const handleClick = (accion) => {
    accion();
    setIsOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* DESKTOP */}
        <div className="hidden sm:flex justify-center items-center gap-8 py-3">
          {categorias.map((cat, index) => (
            <button
              key={index}
              onClick={cat.accion}
              className="text-gray-700 hover:text-[#A47E3B] font-medium text-sm tracking-wide transition-colors"
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* MÓVIL - botón hamburguesa */}
        <div className="sm:hidden flex justify-between items-center py-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-gray-700 font-medium text-sm"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
            <span>{isOpen ? "Cerrar" : "Menú"}</span>
          </button>
        </div>

        {/* MÓVIL - panel desplegable */}
        {isOpen && (
          <div className="sm:hidden border-t border-gray-100 py-2">
            {categorias.map((cat, index) => (
              <button
                key={index}
                onClick={() => handleClick(cat.accion)}
                className="block w-full text-left px-2 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#A47E3B] font-medium text-sm transition-colors"
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

export default MainMenu;
