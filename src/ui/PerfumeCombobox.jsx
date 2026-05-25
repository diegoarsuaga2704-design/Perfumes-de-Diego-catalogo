import { useState, useRef, useEffect } from "react";

/**
 * Combobox de perfume para pedidos_botellas.
 * - Sugiere del catálogo público (parfums) y del historial (perfume_nombre único en pedidos).
 * - Si el texto matchea exactamente un perfume del catálogo, vincula con parfum_id.
 * - Si no matchea, queda como texto libre con parfum_id = null.
 *
 * Props:
 *   nombre: texto actual
 *   parfumId: id del catálogo vinculado (o null)
 *   parfums: array del catálogo público {id, nombre, casa}
 *   historicoNombres: array de nombres únicos en pedidos_botellas
 *   onChange(nombre, parfumId): callback
 */
export default function PerfumeCombobox({
  nombre,
  parfumId,
  parfums,
  historicoNombres,
  onChange,
  onCreateNew,
}) {
  const [texto, setTexto] = useState(nombre || "");
  const [abierto, setAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const wrapperRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  // Sincronizar texto cuando cambia el nombre desde afuera
  useEffect(() => {
    if (!abierto) setTexto(nombre || "");
  }, [nombre, abierto]);

  // Click fuera para cerrar
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        confirmar();
        setAbierto(false);
      }
    }
    if (abierto) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [abierto, texto]);

  function confirmar() {
    const trimmed = texto.trim();
    if (trimmed !== (nombre || "")) {
      const match = parfums.find(
        (p) => (p.nombre || "").toLowerCase() === trimmed.toLowerCase(),
      );
      onChange(trimmed || "(sin nombre)", match?.id || null);
    }
  }

  function seleccionarCatalogo(p) {
    onChange(p.nombre, p.id);
    setTexto(p.nombre);
    setAbierto(false);
  }

  function seleccionarHistorico(n) {
    onChange(n, null);
    setTexto(n);
    setAbierto(false);
  }

  async function handleCreate() {
    const trimmed = texto.trim();
    if (!trimmed) return;
    setCreando(true);
    try {
      const nuevo = await onCreateNew(trimmed);
      onChange(nuevo.nombre, nuevo.id);
      setTexto(nuevo.nombre);
      setAbierto(false);
    } catch {
      alert("Error al crear perfume en catálogo.");
    } finally {
      setCreando(false);
    }
  }

  const q = texto.trim().toLowerCase();

  const sugerenciasCatalogo = q
    ? parfums
        .filter(
          (p) =>
            (p.nombre || "").toLowerCase().includes(q) ||
            (p.casa || "").toLowerCase().includes(q),
        )
        .slice(0, 25)
    : parfums.slice(0, 25);

  const nombresCatalogoLower = new Set(
    parfums.map((p) => (p.nombre || "").toLowerCase()),
  );

  const sugerenciasHistorico = q
    ? historicoNombres
        .filter(
          (n) =>
            n.toLowerCase().includes(q) &&
            !nombresCatalogoLower.has(n.toLowerCase()),
        )
        .slice(0, 15)
    : [];

  return (
    <div ref={wrapperRef} className="relative w-40">
      <input
        type="text"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        title={parfumId ? "Vinculado al catálogo público" : ""}
        className={`w-full px-1 py-0.5 pr-4 border border-transparent hover:border-gray-300 focus:border-[#A47E3B] rounded text-xs text-center bg-transparent ${
          parfumId ? "text-green-700 font-semibold" : ""
        }`}
      />
      {parfumId && (
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-green-600 text-[10px] pointer-events-none">
          ●
        </span>
      )}
      {abierto &&
        (sugerenciasCatalogo.length > 0 || sugerenciasHistorico.length > 0) && (
          <div className="absolute z-40 top-full left-0 mt-0.5 w-72 max-h-80 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg text-xs">
            {sugerenciasCatalogo.length > 0 && (
              <>
                <div className="px-2 py-1 bg-green-50 text-green-800 font-semibold text-[10px] sticky top-0 border-b border-green-200">
                  Catálogo público ({sugerenciasCatalogo.length})
                </div>
                {sugerenciasCatalogo.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => seleccionarCatalogo(p)}
                    className={`w-full text-left px-2 py-1.5 hover:bg-green-50 border-b border-gray-100 ${
                      p.id === parfumId ? "bg-green-100 font-semibold" : ""
                    }`}
                  >
                    <div className="truncate text-gray-900">{p.nombre}</div>
                    {p.casa && (
                      <div className="text-[10px] text-gray-500 truncate">
                        {p.casa}
                      </div>
                    )}
                  </button>
                ))}
              </>
            )}
            {sugerenciasHistorico.length > 0 && (
              <>
                <div className="px-2 py-1 bg-gray-50 text-gray-700 font-semibold text-[10px] sticky top-0 border-b border-gray-200">
                  Del historial ({sugerenciasHistorico.length})
                </div>
                {sugerenciasHistorico.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => seleccionarHistorico(n)}
                    className="w-full text-left px-2 py-1.5 hover:bg-gray-50 border-b border-gray-100 text-gray-700"
                  >
                    {n}
                  </button>
                ))}
              </>
            )}
            {texto.trim() &&
              !parfums.some(
                (p) => (p.nombre || "").toLowerCase() === texto.trim().toLowerCase(),
              ) &&
              onCreateNew && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCreate}
                  disabled={creando}
                  className="w-full text-left px-2 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border-t border-amber-200 font-semibold"
                >
                  {creando
                    ? "Creando en catálogo..."
                    : `+ Crear en catálogo público: "${texto.trim()}"`}
                </button>
              )}
          </div>
        )}
    </div>
  );
}