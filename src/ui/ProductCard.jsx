import { useNavigate } from "react-router-dom";
import { FaTiktok } from "react-icons/fa";

function ProductCard({ parfum }) {
  const navigate = useNavigate();

  // Etiqueta dinámica: MEJOR VENDIDO gana sobre NUEVO
  // Pero no se muestra si está Próximamente o Agotado (prioridad a info crítica)
  const esMejorVendido =
    parfum.esBestSeller === true &&
    parfum.disponible !== "Próximamente" &&
    parfum.disponible !== "Agotado";
  const esNuevo = (() => {
    if (!parfum.created_at) return false;
    if (parfum.disponible === "Próximamente") return false;
    const dias = (new Date() - new Date(parfum.created_at)) / (1000 * 60 * 60 * 24);
    return dias <= 15;
  })();
  const etiqueta = esMejorVendido
    ? { texto: "MEJOR VENDIDO", color: "bg-[#A47E3B]" }
    : esNuevo
      ? { texto: "NUEVO", color: "bg-blue-600" }
      : null;

  const handleCardClick = () => {
    // Convertir el nombre a formato URL-friendly
    const nombreURL = parfum.nombre
      .toLowerCase()
      .normalize("NFD") // elimina acentos
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-") // reemplaza espacios por guiones
      .replace(/[^\w-]+/g, ""); // elimina caracteres especiales

    navigate(`/product/${nombreURL}/${parfum.id}`);
  };

  return (
    <div
      key={parfum.id}
      onClick={handleCardClick}
      className={`cursor-pointer bg-white relative shadow-md rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300
        ${parfum.disponible === "Agotado" ? "shadow-red-600" : ""}
      ${parfum.disponible === "Próximamente" ? "shadow-yellow-600" : ""}`}
    >
      {/* Etiqueta dinámica (esquina superior izquierda) */}
      {etiqueta && (
        <span
          className={`absolute top-2 left-2 z-10 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md shadow-md ${etiqueta.color}`}
        >
          {etiqueta.texto}
        </span>
      )}

      {/* Etiqueta de disponibilidad (esquina superior derecha) */}
      <span
        className={`absolute top-2 right-2 text-white text-xs sm:text-sm font-semibold px-3 py-1 rounded-md  ${
          parfum.disponible === "Agotado" ? "bg-red-600" : ""
        }
      ${parfum.disponible === "Próximamente" ? "bg-yellow-500" : ""} ${
        parfum.disponible === "Disponible" ? "hidden" : ""
      }`}
      >
        {parfum.disponible === "Disponible" ? "" : parfum.disponible}
      </span>

      <img
        src={parfum.image}
        alt={parfum.nombre}
        loading="lazy"
        className="w-full h-100 object-cover pt-2"
      />
      <div className="sm:p-5 px-2 py-5 flex flex-col justify-between">
        <h3 className="sm:text-lg text-sm font-semibold text-gray-900 mb-2 2xl:flex-row">
          {parfum.nombre}
        </h3>
        <div className="text-gray-500 text-xs mb-4">
          {parfum.casa}
          <p className="italic">{parfum.concentracion}</p>
        </div>
        <div className="border-t border-gray-200 pt-4 flex flex-col justify-between">
          <span className="text-gray-800 text-sm font-semibold">
            Precio: ${parfum.precio}
            {!parfum.stock && "/ml"}
          </span>
          <span className="hidden sm:block text-xs text-gray-600">
            {parfum.notas}
          </span>

          {parfum.tiktokLink && (
            <a
              href={parfum.tiktokLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-flex items-center justify-center gap-1 text-[10px] sm:text-xs text-[#A47E3B] hover:text-[#D4AF7A] font-semibold border border-[#A47E3B] rounded-md py-1 px-2 w-fit"
            >
              <FaTiktok className="h-3 w-3" />
              Ver video
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
