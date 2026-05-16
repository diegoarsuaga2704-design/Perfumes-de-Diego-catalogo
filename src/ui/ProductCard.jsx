import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaTiktok } from "react-icons/fa";
import { ShoppingCart, Check } from "lucide-react";
import { slugify } from "../functions/slugify";
import { useCart } from "../context/CartContext";
import { getMililitrosMinimos } from "../functions/pricingDecant";

function ProductCard({ parfum }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [agregado, setAgregado] = useState(false);

  const esBotellaCompleta = parfum.stock === true;
  const esDecant = parfum.stock === false;
  const mlMinimo = esDecant ? getMililitrosMinimos(parfum) : null;

  // Etiqueta dinámica: MEJOR VENDIDO gana sobre NUEVO.
  // Ninguna se muestra si el perfume está Próximamente o Agotado
  // (la info crítica de disponibilidad gana sobre la promocional).
  const esDisponible =
    parfum.disponible !== "Próximamente" && parfum.disponible !== "Agotado";

  const esMejorVendido = parfum.esBestSeller === true && esDisponible;

  const esNuevo = (() => {
    if (!esDisponible) return false;
    if (!parfum.created_at) return false;
    const dias =
      (new Date() - new Date(parfum.created_at)) / (1000 * 60 * 60 * 24);
    return dias <= 15;
  })();

  const etiqueta = esMejorVendido
    ? { texto: "MEJOR VENDIDO", color: "bg-[#A47E3B]" }
    : esNuevo
      ? { texto: "NUEVO", color: "bg-blue-600" }
      : null;

  const handleCardClick = () => {
    navigate(`/product/${slugify(parfum.nombre)}/${parfum.id}`);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();

    if (esDecant) {
      addToCart({
        id: parfum.id,
        nombre: parfum.nombre,
        image: parfum.image,
        casa: parfum.casa,
        tipoVenta: "decant",
        precioUnitario: parfum.precio,
        precio30ml: parfum.precio30ml || null,
        mlBotella: null,
        mililitros: mlMinimo,
        cantidad: null,
        stockDisponible: null,
      });
    } else {
      addToCart({
        id: parfum.id,
        nombre: parfum.nombre,
        image: parfum.image,
        casa: parfum.casa,
        tipoVenta: "botella",
        precioUnitario: parfum.precio,
        precio30ml: null,
        mlBotella: parfum.mlBotella || null,
        mililitros: null,
        cantidad: 1,
        stockDisponible: parfum.botellasDisponibles,
      });
    }

    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  };

  return (
    <div
      key={parfum.id}
      onClick={handleCardClick}
      className={`cursor-pointer bg-white relative shadow-md rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300
        ${parfum.disponible === "Agotado" ? "shadow-red-600" : ""}
      ${parfum.disponible === "Próximamente" ? "shadow-sky-600" : ""}`}
    >
      {/* Etiqueta dinámica (esquina superior derecha) */}
      {etiqueta && (
        <span
          className={`absolute top-2 right-2 z-10 text-white text-xs sm:text-sm font-semibold px-3 py-1 rounded-md ${etiqueta.color}`}
        >
          {etiqueta.texto}
        </span>
      )}

      {/* Etiqueta de disponibilidad (esquina superior derecha) */}
      <span
        className={`absolute top-2 right-2 z-10 text-white text-xs sm:text-sm font-semibold px-3 py-1 rounded-md ${
          parfum.disponible === "Agotado" ? "bg-red-600" : ""
        }
      ${parfum.disponible === "Próximamente" ? "bg-sky-600" : ""} ${
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
        <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
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
              className="inline-flex items-center justify-center gap-1 text-[10px] sm:text-xs text-[#A47E3B] hover:text-[#D4AF7A] font-semibold border border-[#A47E3B] rounded-md py-1 px-2 w-fit"
            >
              <FaTiktok className="h-3 w-3" />
              Ver video
            </a>
          )}

          {esDisponible && (
            <button
              onClick={handleQuickAdd}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                agregado
                  ? "bg-green-500 text-white"
                  : "bg-[#A47E3B] text-white hover:bg-[#D4AF7A] active:bg-[#8B6A30]"
              }`}
            >
              {agregado ? (
                <>
                  <Check size={16} />
                  Agregado
                </>
              ) : (
                <>
                  <ShoppingCart size={16} />
                  {esDecant ? `Agregar ${mlMinimo} ml` : "Agregar al pedido"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
