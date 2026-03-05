import { useNavigate } from "react-router-dom";

function ProductCard({ parfum }) {
  const navigate = useNavigate();

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
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
