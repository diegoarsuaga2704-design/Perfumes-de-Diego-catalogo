import {
  getOpcionesMililitros,
  calcularPrecioDecant,
} from "../functions/pricingDecant";

/**
 * Selector de mililitros en formato grid: muestra cada medida con su precio,
 * todo visible, un toque para elegir. Reemplaza al dropdown para decants.
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
          const precio = calcularPrecioDecant(parfum, opt.value);

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={seleccionado}
              className={`flex flex-col items-center justify-center rounded-lg border px-3 py-2.5 transition-colors ${
                seleccionado
                  ? "bg-[#A47E3B] border-[#A47E3B] text-white shadow-sm"
                  : "bg-white border-gray-300 text-gray-800 hover:border-[#A47E3B] active:bg-[#A47E3B]/5"
              }`}
            >
              <span className="font-semibold">{opt.label}</span>
              <span
                className={`text-sm ${
                  seleccionado ? "text-white/90" : "text-gray-500"
                }`}
              >
                ${precio.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
