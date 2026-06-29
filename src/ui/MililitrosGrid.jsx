import { getOpcionesMililitros } from "../functions/pricingDecant";

/**
 * Selector de mililitros en formato grid: cada medida en un botón, un toque
 * para elegir. El precio total se muestra abajo del botón "Añadir al carrito".
 */
export default function MililitrosGrid({ parfum, value, onChange }) {
  const opciones = getOpcionesMililitros(parfum);

  return (
    <div>
      <p className="font-semibold text-gray-800 mb-3 text-base">
        ¿Cuántos ml quieres?
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {opciones.map((opt) => {
          const seleccionado = value === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={seleccionado}
              className={`flex items-center justify-center rounded-lg border px-3 py-3 font-semibold transition-colors ${
                seleccionado
                  ? "bg-[#A47E3B] border-[#A47E3B] text-white shadow-sm"
                  : "bg-white border-gray-300 text-gray-800 hover:border-[#A47E3B] active:bg-[#A47E3B]/5"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
