import { useOrder } from "../context/OrderContext.jsx";

const OPCIONES_CASA = [
  ["az", "Casa (A-Z)"],
  ["za", "Casa (Z-A)"],
  ["ninguno", "Todas las casas juntas"],
];

const OPCIONES_DENTRO = [
  ["precio", "Precio (menor a mayor)"],
  ["precioMayor", "Precio (mayor a menor)"],
  ["nombre", "Nombre (A-Z)"],
];

const selectCls =
  "appearance-none bg-transparent text-gray-500 hover:text-gray-700 text-xs sm:text-sm pl-1 sm:pl-2 pr-5 sm:pr-6 py-1 sm:py-2 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A47E3B]/40 bg-no-repeat bg-[right_0.25rem_center] bg-[length:1rem]";
const flecha =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

// Dos selectores que se combinan: orden de las casas y orden dentro de cada
// casa (o de todo el catálogo si se eligen todas las casas juntas).
function OrdenarPor() {
  const { ordenCasa, setOrdenCasa, ordenDentro, setOrdenDentro } = useOrder();

  return (
    <div className="flex flex-wrap min-[380px]:flex-nowrap justify-center sm:justify-end items-center gap-x-1 text-xs sm:text-sm text-gray-400 shrink-0">
      <span className="text-gray-400 whitespace-nowrap">
        <span className="sm:hidden">Ordenar:</span>
        <span className="hidden sm:inline">Ordenar por:</span>
      </span>
      <select
        aria-label="Orden de las casas"
        value={ordenCasa}
        onChange={(e) => setOrdenCasa(e.target.value)}
        className={selectCls}
        style={{ backgroundImage: flecha }}
      >
        {OPCIONES_CASA.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
      <span className="text-gray-300">·</span>
      <select
        aria-label={ordenCasa === "ninguno" ? "Orden" : "Orden dentro de cada casa"}
        value={ordenDentro}
        onChange={(e) => setOrdenDentro(e.target.value)}
        className={selectCls}
        style={{ backgroundImage: flecha }}
      >
        {OPCIONES_DENTRO.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}

export default OrdenarPor;
