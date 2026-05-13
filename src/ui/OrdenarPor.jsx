import { useState } from "react";
import { useOrder } from "../context/OrderContext.jsx";

function OrdenarPor() {
  const [openOrdenar, setOpenOrdenar] = useState(null);
  const { order, setOrder } = useOrder();

  const toggleOrdenar = (menu) => {
    setOpenOrdenar(openOrdenar === menu ? null : menu);
  };

  return (
    <div className="flex justify-end items-center text-sm text-gray-400 sm:px-6 px-2">
      {/* Botón principal */}
      <div className="relative">
        <button
          onClick={() => toggleOrdenar("menu")}
          className="flex items-center gap-2 text-gray-400 sm:px-4 px-2 py-2 rounded-md hover:text-gray-500 transition-colors"
        >
          Ordenar por:{" "}
          {order === "nombre"
            ? "Nombre (A-Z)"
            : order === "casa"
            ? "Casa (A-Z)"
            : order === "precio"
            ? "Precio (Menor a Mayor)"
            : order === "precioMayor"
            ? "Precio (Mayor a Menor)"
            : ""}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 transition-transform duration-300 ${
              openOrdenar ? "rotate-180" : "rotate-0"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Menú desplegable */}
        {openOrdenar && (
          <div
            className="absolute mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50
                     max-h-48 overflow-y-auto"
          >
            <div className=" text-gray-500 text-xs">
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                onClick={() => {
                  setOrder("nombre");
                  toggleOrdenar(null);
                }}
              >
                Nombre (A-Z)
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                onClick={() => {
                  setOrder("casa");
                  toggleOrdenar(null);
                }}
              >
                Casa (A-Z)
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                onClick={() => {
                  setOrder("precio");
                  toggleOrdenar(null);
                }}
              >
                Precio (Menor a Mayor)
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                onClick={() => {
                  setOrder("precioMayor");
                  toggleOrdenar(null);
                }}
              >
                Precio (Mayor a Menor)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdenarPor;
