import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  getListaCotizador,
  agregarAListaCotizador,
  borrarDeListaCotizador,
} from "../functions/getCotizaciones";
import { normalizarTexto } from "../functions/normalizarTexto";

const INPUT =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-base bg-white focus:ring-2 focus:ring-[#A47E3B] focus:outline-none";

// Campo con sugerencias de la lista y opción "Editar lista" para agregar y
// quitar nombres.
// Se guarda en la tabla indicada (p. ej. proveedores_cotizador).
export default function SelectorLista({ tabla, etiqueta, articulo = "un", value, onChange, onItems }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [nuevo, setNuevo] = useState("");
  const singular = etiqueta.toLowerCase();

  const actualizar = (lista) => {
    setItems(lista);
    onItems?.(lista);
  };

  useEffect(() => {
    getListaCotizador(tabla)
      .then(actualizar)
      .catch(() => setError(`No se pudo cargar la lista. ¿Ya corriste el SQL de ${tabla}?`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabla]);

  // Sugerencias mientras escribes (sin acentos ni mayúsculas).
  const [abierto, setAbierto] = useState(false);
  const q = normalizarTexto((value || "").trim());
  const sugerencias = q
    ? [
        ...items.filter((p) => normalizarTexto(p.nombre).startsWith(q)),
        ...items.filter(
          (p) => !normalizarTexto(p.nombre).startsWith(q) && normalizarTexto(p.nombre).includes(q),
        ),
      ].slice(0, 8)
    : items.slice(0, 8);
  const puedeAgregar = Boolean(q) && !items.some((p) => normalizarTexto(p.nombre) === q);

  const agregar = async (texto = nuevo) => {
    const limpio = (texto || "").trim();
    if (!limpio) return;
    if (items.some((p) => normalizarTexto(p.nombre) === normalizarTexto(limpio))) {
      setError(`Ese nombre ya está en la lista.`);
      return;
    }
    try {
      const creado = await agregarAListaCotizador(tabla, limpio);
      actualizar([...items, creado].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
      setNuevo("");
      setError("");
      onChange(creado.nombre);
    } catch {
      setError(`No se pudo agregar. ¿Ya corriste el SQL de ${tabla}?`);
    }
  };

  const quitar = async (p) => {
    if (!window.confirm(`¿Quitar ${p.nombre} de la lista? Las cotizaciones guardadas no cambian.`)) return;
    try {
      await borrarDeListaCotizador(tabla, p.id);
      actualizar(items.filter((x) => x.id !== p.id));
      if (value === p.nombre) onChange("");
    } catch {
      setError("No se pudo quitar.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{etiqueta}</span>
        <button
          type="button"
          onClick={() => setEditando((v) => !v)}
          className="text-xs text-[#A47E3B] hover:underline"
        >
          {editando ? "Listo" : "Editar lista"}
        </button>
      </div>
      {/* Se escribe y va sugiriendo de la lista: primero los que empiezan
          con lo escrito y luego los que lo contienen. */}
      <div className="relative mt-1">
        <input
          className={INPUT}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && sugerencias[0]) {
              e.preventDefault();
              onChange(sugerencias[0].nombre);
              setAbierto(false);
            }
            if (e.key === "Escape") setAbierto(false);
          }}
          placeholder={`Escribe ${articulo === "una" ? "la" : "el"} ${singular}`}
          autoComplete="off"
        />
        {abierto && (sugerencias.length > 0 || puedeAgregar) && (
          <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
            {sugerencias.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(p.nombre);
                    setAbierto(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  {p.nombre}
                </button>
              </li>
            ))}
            {puedeAgregar && (
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    agregar(value);
                    setAbierto(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-[#A47E3B] font-semibold hover:bg-gray-100 border-t border-gray-100"
                >
                  + Agregar “{value.trim()}” a la lista
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {editando && (
        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2">
          <div className="flex gap-2">
            <input
              className={INPUT}
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && agregar(nuevo)}
              placeholder={`Nombre de ${articulo === "una" ? "la" : "el"} ${singular}`}
            />
            <button
              type="button"
              onClick={() => agregar(nuevo)}
              className="shrink-0 bg-[#A47E3B] text-white px-4 rounded-md text-sm font-semibold hover:bg-[#8b6d32]"
            >
              Agregar
            </button>
          </div>
          {items.length > 0 && (
            <ul className="divide-y divide-gray-200 text-sm max-h-60 overflow-y-auto">
              {items.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-1.5">
                  <span>{p.nombre}</span>
                  <button
                    type="button"
                    onClick={() => quitar(p)}
                    aria-label={`Quitar ${p.nombre}`}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
