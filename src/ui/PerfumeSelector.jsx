import { useEffect, useMemo, useState } from "react";
import { Search, Plus, X, AlertCircle, Minus, Check } from "lucide-react";
import { getAllParfumsAdmin } from "../functions/getParfumsAdmin";
import {
  getIncrementoMililitros,
  getMililitrosMinimos,
} from "../functions/pricingDecant";

/**
 * Selector de perfumes con cantidad de ml para incluir en un paquete.
 *
 * Props:
 *  - value: array de items [{ parfumId, mililitros }]
 *  - onChange: función que recibe el nuevo array
 */
export default function PerfumeSelector({ value = [], onChange }) {
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchParfums();
  }, []);

  const fetchParfums = async () => {
    try {
      const data = await getAllParfumsAdmin();
      setParfums(data);
    } catch (err) {
      console.error("Error cargando perfumes:", err);
    } finally {
      setLoading(false);
    }
  };

  const parfumsById = useMemo(() => {
    const map = {};
    parfums.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [parfums]);

  const itemsConInfo = useMemo(() => {
    return (value || []).map((item) => ({
      ...item,
      parfum: parfumsById[item.parfumId] || null,
    }));
  }, [value, parfumsById]);

  const selectedIds = useMemo(
    () => new Set((value || []).map((i) => i.parfumId)),
    [value],
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return parfums
      .filter((p) => p.stock === false) // Solo decants, no botellas
      .filter((p) => !selectedIds.has(p.id))
      .filter(
        (p) =>
          (p.nombre || "").toLowerCase().includes(q) ||
          (p.casa || "").toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [search, parfums, selectedIds]);

  const handleAddParfum = (parfum) => {
    // ml inicial = mínimo permitido del perfume (0.5 para Ensar, 1 para resto)
    const mlInicial = getMililitrosMinimos(parfum);
    const newItems = [
      ...(value || []),
      { parfumId: parfum.id, mililitros: mlInicial },
    ];
    onChange?.(newItems);
    // NO cerramos el buscador NI vaciamos search → permite agregar más rápido
  };

  const handleRemoveItem = (parfumId) => {
    const newItems = (value || []).filter((i) => i.parfumId !== parfumId);
    onChange?.(newItems);
  };

  const handleChangeMililitros = (parfumId, mililitros) => {
    const newItems = (value || []).map((i) =>
      i.parfumId === parfumId
        ? { ...i, mililitros: Number(mililitros) || 0 }
        : i,
    );
    onChange?.(newItems);
  };

  const handleIncrementar = (parfumId) => {
    const item = (value || []).find((i) => i.parfumId === parfumId);
    if (!item) return;
    const parfum = parfumsById[parfumId];
    if (!parfum) return;

    const incremento = getIncrementoMililitros(parfum);
    const nuevoMl = (Number(item.mililitros) || 0) + incremento;
    handleChangeMililitros(parfumId, nuevoMl);
  };

  const handleDecrementar = (parfumId) => {
    const item = (value || []).find((i) => i.parfumId === parfumId);
    if (!item) return;
    const parfum = parfumsById[parfumId];
    if (!parfum) return;

    const incremento = getIncrementoMililitros(parfum);
    const minimo = getMililitrosMinimos(parfum);
    const nuevoMl = Math.max(
      minimo,
      (Number(item.mililitros) || 0) - incremento,
    );
    handleChangeMililitros(parfumId, nuevoMl);
  };

  const getDisponibleColor = (disponible) => {
    if (disponible === "Disponible")
      return "bg-green-100 text-green-700 border-green-200";
    if (disponible === "Agotado") return "bg-red-100 text-red-700 border-red-200";
    if (disponible === "Próximamente")
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500 italic">Cargando perfumes...</div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Lista de perfumes seleccionados */}
      {itemsConInfo.length === 0 ? (
        <div className="text-sm text-gray-500 italic bg-gray-50 border border-dashed border-gray-300 rounded-md p-4 text-center">
          Aún no agregaste perfumes a este paquete
        </div>
      ) : (
        <div className="space-y-2">
          {itemsConInfo.map((item) => {
            if (!item.parfum) {
              return (
                <div
                  key={item.parfumId}
                  className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle size={16} />
                    Perfume id #{item.parfumId} ya no existe en el catálogo
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.parfumId)}
                    className="text-red-600 hover:bg-red-100 rounded p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            }

            const incremento = getIncrementoMililitros(item.parfum);
            const minimo = getMililitrosMinimos(item.parfum);
            const puedeBajar = (Number(item.mililitros) || 0) > minimo;

            return (
              <div
                key={item.parfumId}
                className="bg-white border border-gray-200 rounded-md p-3 flex items-center gap-3"
              >
                <img
                  src={item.parfum.image}
                  alt={item.parfum.nombre}
                  className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {item.parfum.nombre}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {item.parfum.casa}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${getDisponibleColor(
                        item.parfum.disponible,
                      )}`}
                    >
                      {item.parfum.disponible || "—"}
                    </span>
                  </div>
                </div>

                {/* Controles de ml: −  [input]  +  ml */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDecrementar(item.parfumId)}
                    disabled={!puedeBajar}
                    className={`w-8 h-8 flex items-center justify-center border rounded-md transition-colors ${
                      puedeBajar
                        ? "border-gray-300 text-gray-700 hover:bg-gray-100"
                        : "border-gray-200 text-gray-300 cursor-not-allowed"
                    }`}
                    title={`-${incremento} ml`}
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.mililitros ?? ""}
                    onChange={(e) =>
                      handleChangeMililitros(item.parfumId, e.target.value)
                    }
                    className="w-14 px-1 py-1 border border-gray-300 rounded text-sm text-center focus:ring-1 focus:ring-[#A47E3B] focus:border-[#A47E3B] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleIncrementar(item.parfumId)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    title={`+${incremento} ml`}
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-xs text-gray-500 ml-1">ml</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.parfumId)}
                    className="ml-1 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Quitar"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Buscador para agregar */}
      {!showSearch ? (
        <button
          type="button"
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-2 text-sm bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          <Plus size={16} />
          Agregar perfume al paquete
        </button>
      ) : (
        <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-md p-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o casa..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A47E3B] focus:border-[#A47E3B] outline-none bg-white"
            />
          </div>

          {search.trim() && searchResults.length === 0 && (
            <div className="text-sm text-gray-500 italic px-2 py-3 text-center">
              No hay perfumes que coincidan
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddParfum(p)}
                  className="w-full flex items-center gap-3 bg-white hover:bg-amber-50 border border-gray-200 hover:border-[#A47E3B] rounded-md p-2 text-left transition-colors"
                >
                  <img
                    src={p.image}
                    alt={p.nombre}
                    className="w-10 h-10 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {p.nombre}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{p.casa}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${getDisponibleColor(
                          p.disponible,
                        )}`}
                      >
                        {p.disponible || "—"}
                      </span>
                    </div>
                  </div>
                  <Plus size={16} className="text-[#A47E3B] flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {(value || []).length > 0 && (
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <Check size={12} className="text-green-600" />
                {(value || []).length} perfume
                {(value || []).length !== 1 ? "s" : ""} agregado
                {(value || []).length !== 1 ? "s" : ""}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearch("");
              }}
              className="ml-auto text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded font-medium"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
