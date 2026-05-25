import { useState, useRef, useEffect } from "react";

/**
 * Combobox de cliente con búsqueda y creación al vuelo.
 * Props:
 *   value: id del cliente actual (o null)
 *   clientes: array de {id, nombre, es_propio}
 *   onChange(id): cambia el cliente
 *   onCreateNew(nombre): crea uno nuevo y devuelve {id, nombre}
 */
export default function ClienteCombobox({ value, clientes, onChange, onCreateNew }) {
  const clienteActual = clientes.find((c) => c.id === value);
  const [texto, setTexto] = useState(clienteActual?.nombre || "");
  const [abierto, setAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const wrapperRef = useRef(null);

  // Si cambia el value externamente, sincronizar
  useEffect(() => {
    const c = clientes.find((c) => c.id === value);
    if (!abierto) setTexto(c?.nombre || "");
  }, [value, clientes, abierto]);

  // Click fuera para cerrar
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setAbierto(false);
        const c = clientes.find((c) => c.id === value);
        setTexto(c?.nombre || "");
      }
    }
    if (abierto) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [abierto, clientes, value]);

  const filtrados = texto.trim()
    ? clientes.filter((c) =>
        (c.nombre || "").toLowerCase().includes(texto.toLowerCase().trim()),
      )
    : clientes;

  const matchExacto = clientes.some(
    (c) => (c.nombre || "").toLowerCase() === texto.toLowerCase().trim(),
  );

  async function handleCreate() {
    if (!texto.trim()) return;
    setCreando(true);
    try {
      const nuevo = await onCreateNew(texto.trim());
      onChange(nuevo.id);
      setAbierto(false);
    } catch {
      alert("Error al crear cliente.");
    } finally {
      setCreando(false);
    }
  }

  function handleSelect(c) {
    onChange(c.id);
    setTexto(c.nombre);
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
        placeholder="— sin cliente —"
        className="w-full px-1 py-0.5 border border-transparent hover:border-gray-300 focus:border-[#A47E3B] rounded text-xs text-center"
      />
      {abierto && (
        <div className="absolute z-40 top-full left-0 mt-0.5 w-56 max-h-64 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg text-xs">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full text-left px-2 py-1.5 hover:bg-red-50 text-red-600 border-b border-gray-200"
            >
              — Sin cliente —
            </button>
          )}
          {filtrados.length === 0 && !texto.trim() && (
            <p className="px-2 py-2 text-gray-400">Escribe para buscar...</p>
          )}
          {filtrados.slice(0, 50).map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => handleSelect(c)}
              className={`w-full text-left px-2 py-1.5 hover:bg-blue-50 ${
                c.id === value ? "bg-blue-100 font-semibold" : ""
              }`}
            >
              {c.nombre}
              {c.es_propio && <span className="ml-1 text-amber-500">⭐</span>}
            </button>
          ))}
          {texto.trim() && !matchExacto && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creando}
              className="w-full text-left px-2 py-1.5 bg-green-50 hover:bg-green-100 text-green-800 border-t border-gray-200 font-semibold"
            >
              {creando ? "Creando..." : `+ Crear cliente: "${texto.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}