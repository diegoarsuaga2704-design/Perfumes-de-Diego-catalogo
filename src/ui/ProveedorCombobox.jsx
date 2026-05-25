import { useState, useRef, useEffect } from "react";

/**
 * Combobox de proveedor con búsqueda y creación al vuelo.
 * Props:
 *   value: id del proveedor actual (o null)
 *   proveedores: array de {id, nombre}
 *   onChange(id): cambia el proveedor
 *   onCreateNew(nombre): crea uno nuevo y devuelve {id, nombre}
 */
export default function ProveedorCombobox({ value, proveedores, onChange, onCreateNew }) {
  const provActual = proveedores.find((p) => p.id === value);
  const [texto, setTexto] = useState(provActual?.nombre || "");
  const [abierto, setAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const p = proveedores.find((p) => p.id === value);
    if (!abierto) setTexto(p?.nombre || "");
  }, [value, proveedores, abierto]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setAbierto(false);
        const p = proveedores.find((p) => p.id === value);
        setTexto(p?.nombre || "");
      }
    }
    if (abierto) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [abierto, proveedores, value]);

  const filtrados = texto.trim()
    ? proveedores.filter((p) =>
        (p.nombre || "").toLowerCase().includes(texto.toLowerCase().trim()),
      )
    : proveedores;

  const matchExacto = proveedores.some(
    (p) => (p.nombre || "").toLowerCase() === texto.toLowerCase().trim(),
  );

  async function handleCreate() {
    if (!texto.trim()) return;
    setCreando(true);
    try {
      const nuevo = await onCreateNew(texto.trim());
      onChange(nuevo.id);
      setAbierto(false);
    } catch {
      alert("Error al crear proveedor.");
    } finally {
      setCreando(false);
    }
  }

  function handleSelect(p) {
    onChange(p.id);
    setTexto(p.nombre);
    setAbierto(false);
  }

  function handleClear() {
    onChange(null);
    setTexto("");
    setAbierto(false);
  }

  return (
    <div ref={wrapperRef} className="relative w-32">
      <input
        type="text"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        placeholder="— proveedor —"
        className="w-full px-1 py-0.5 border border-transparent hover:border-gray-300 focus:border-[#A47E3B] rounded text-xs text-center"
      />
      {abierto && (
        <div className="absolute z-40 top-full left-0 mt-0.5 w-56 max-h-64 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg text-xs">
          {value && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClear}
              className="w-full text-left px-2 py-1.5 hover:bg-red-50 text-red-600 border-b border-gray-200"
            >
              — Sin proveedor —
            </button>
          )}
          {filtrados.length === 0 && !texto.trim() && (
            <p className="px-2 py-2 text-gray-400">Escribe para buscar...</p>
          )}
          {filtrados.slice(0, 50).map((p) => (
            <button
              type="button"
              key={p.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(p)}
              className={`w-full text-left px-2 py-1.5 hover:bg-blue-50 ${
                p.id === value ? "bg-blue-100 font-semibold" : ""
              }`}
            >
              {p.nombre}
            </button>
          ))}
          {texto.trim() && !matchExacto && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCreate}
              disabled={creando}
              className="w-full text-left px-2 py-1.5 bg-green-50 hover:bg-green-100 text-green-800 border-t border-gray-200 font-semibold"
            >
              {creando ? "Creando..." : `+ Crear proveedor: "${texto.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}