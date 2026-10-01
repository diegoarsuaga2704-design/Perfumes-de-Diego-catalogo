import { Link } from "react-router-dom";

// Tarjeta de la portada. Es un enlace real: se puede abrir en otra pestaña y
// Google lo sigue.
function HomeBrand({ image, title, description, to, eager = false }) {
  return (
    <Link
      to={to}
      className="block relative rounded-lg overflow-hidden shadow-lg group cursor-pointer"
    >
      {/* Imagen de fondo */}
      <img
        src={image}
        alt={title}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
        className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Overlay degradado */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#A47E3B]/70 to-transparent" />
      {/* Contenido */}
      <div className="absolute bottom-0 p-6 text-white text-center w-full">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-sm mb-4">{description}</p>
        <span className="inline-block bg-white text-black font-semibold py-2 px-4 rounded group-hover:bg-gray-200 group-active:bg-gray-300 transition">
          Ir a comprar
        </span>
      </div>
    </Link>
  );
}

export default HomeBrand;