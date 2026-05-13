export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxPageButtons = 5,
  scrollRef,
}) {
  // Calcular el rango de páginas visibles
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = startPage + maxPageButtons - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  const scrollToTopAfterRender = () => {
    // Esperamos al siguiente ciclo de render para asegurar que el contenido ya se pintó
    requestAnimationFrame(() => {
      // Pequeña pausa extra (en ms) por seguridad en móviles
      setTimeout(() => {
        // Si el contenedor tiene ref, desplazamos hacia él
        if (scrollRef?.current) {
          const y =
            scrollRef.current.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: y - 20, behavior: "smooth" });
        } else {
          // Si no hay ref, desplazamos toda la ventana
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100); // <-- Ajustable: puedes probar entre 50 y 200 ms
    });
  };

  // Función que maneja el cambio de página y hace scroll al top
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    onPageChange(pageNumber);
    // Scroll al top del grid de productos
    scrollToTopAfterRender();
  };

  return (
    <div className="flex justify-center items-center mt-6 gap-2">
      {/* Flecha anterior */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 bg-transparent 
            ${
              currentPage === 1
                ? " text-gray-400 cursor-not-allowed"
                : " text-gray-800 hover:text-[#A47E3B]"
            }
        ${totalPages <= 1 ? "hidden" : ""}`}
      >
        {"<"}
      </button>

      {/* Botones de página */}
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => handlePageChange(number)}
          className={`px-3 py-1 rounded-md ${
            totalPages === 1
              ? "hidden"
              : currentPage === number
              ? "bg-[#A47E3B] text-white"
              : " text-gray-800 hover:bg-gray-200"
          }`}
        >
          {number}
        </button>
      ))}

      {/* Flecha siguiente */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 bg-transparent 
            ${
              currentPage === totalPages
                ? " text-gray-400 cursor-not-allowed"
                : " text-gray-800 hover:text-[#A47E3B]"
            }
        ${totalPages <= 1 ? "hidden" : ""}`}
      >
        {">"}
      </button>
    </div>
  );
}
