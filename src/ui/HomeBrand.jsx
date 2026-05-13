function HomeBrand({ image, title, description, onClick }) {
  return (
    <div
      onClick={onClick}
      className="relative rounded-lg overflow-hidden shadow-lg group cursor-pointer"
    >
      {/* Imagen de fondo */}
      <img
        src={image}
        alt={title}
        className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Overlay degradado */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#A47E3B]/70 to-transparent" />
      {/* Contenido */}
      <div className="absolute bottom-0 p-6 text-white text-center w-full">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-sm mb-4">{description}</p>
        <button
          type="button"
          className="bg-white text-black font-semibold py-2 px-4 rounded hover:bg-gray-200 transition"
        >
          Ir a comprar
        </button>
      </div>
    </div>
  );
}

export default HomeBrand;