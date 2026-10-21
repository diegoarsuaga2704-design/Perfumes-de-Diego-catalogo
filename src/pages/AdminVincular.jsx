import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Link2, Check } from "lucide-react";
import { getAllParfumsAdmin, updateParfumAdmin } from "../functions/getParfumsAdmin";
import { esMismoPerfume, posibleMismo } from "../functions/mismoPerfume";
import renombrarPerfumeVip from "../functions/renombrarPerfumeVip";
import { formatPrecio } from "../functions/formatPrecio";

const LS_DESCARTADOS = "admin_vincular_descartados";
const leerDescartados = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_DESCARTADOS) || "[]"));
  } catch {
    return new Set();
  }
};
const parId = (d, b) => `${d.id}-${b.id}`;

// Decant y botella se enlazan solos en la tienda cuando coinciden nombre,
// casa y concentración. Esta pantalla muestra los que ya están vinculados y
// propone los que parecen el mismo perfume pero están escritos distinto,
// para igualarlos con un botón.
export default function AdminVincular() {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(null);
  const [descartados, setDescartados] = useState(leerDescartados);
  const [verVinculados, setVerVinculados] = useState(false);
  const [msg, setMsg] = useState("");

  const cargar = () => {
    setCargando(true);
    getAllParfumsAdmin()
      .then((d) => setTodos(d))
      .catch(() => setError("No se pudo cargar el catálogo."))
      .finally(() => setCargando(false));
  };
  useEffect(cargar, []);

  const { vinculados, candidatos } = useMemo(() => {
    const decants = todos.filter((p) => p.stock === false);
    const botellas = todos.filter((p) => p.stock === true);
    const vinc = [];
    const cand = [];
    for (const d of decants) {
      for (const b of botellas) {
        if (esMismoPerfume(d, b)) vinc.push([d, b]);
        else if (posibleMismo(d, b) && !descartados.has(parId(d, b))) cand.push([d, b]);
      }
    }
    return { vinculados: vinc, candidatos: cand };
  }, [todos, descartados]);

  // Iguala nombre, casa y concentración del "destino" con los del "modelo".
  const vincular = async (modelo, destino) => {
    setOcupado(parId(modelo.stock ? destino : modelo, modelo.stock ? modelo : destino));
    setMsg("");
    try {
      const cambios = {
        nombre: modelo.nombre,
        casa: modelo.casa,
        concentracion: modelo.concentracion || destino.concentracion,
      };
      await updateParfumAdmin(destino.id, cambios);
      if (destino.nombre !== modelo.nombre) {
        // Las sesiones VIP guardan los perfumes por nombre.
        await renombrarPerfumeVip(destino.nombre, modelo.nombre).catch(() => {});
      }
      setMsg(`Vinculado: ${modelo.nombre} (${modelo.casa}).`);
      cargar();
    } catch {
      setMsg("No se pudo guardar. Revisa la conexión o los permisos.");
    } finally {
      setOcupado(null);
    }
  };

  const descartar = (d, b) => {
    const nuevo = new Set(descartados);
    nuevo.add(parId(d, b));
    setDescartados(nuevo);
    try {
      localStorage.setItem(LS_DESCARTADOS, JSON.stringify([...nuevo]));
    } catch {
      // sin persistencia
    }
  };

  const Ficha = ({ p, otro }) => {
    const dif = (campo) =>
      (p[campo] || "") !== (otro[campo] || "") ? "bg-amber-100 rounded px-1" : "";
    return (
      <div className="flex-1 min-w-0 rounded-lg border border-gray-200 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">
          {p.stock ? "Botella" : "Decant"} · {p.disponible}
        </p>
        <p className={`font-semibold text-gray-900 ${dif("nombre")}`}>{p.nombre}</p>
        <p className={`text-sm text-gray-600 ${dif("casa")}`}>{p.casa}</p>
        <p className={`text-xs text-gray-500 italic ${dif("concentracion")}`}>
          {p.concentracion || "sin concentración"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          ${formatPrecio(p.precio)}
          {p.stock ? "" : "/ml"}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="p-2 hover:bg-gray-700 rounded-md">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold">Vincular decants y botellas</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <p className="text-sm text-gray-600">
          En la tienda, el decant y la botella de un perfume se enlazan solos cuando tienen el
          mismo nombre, casa y concentración. Aquí ves los que ya lo están y los que parecen el
          mismo perfume pero están escritos distinto (lo diferente aparece resaltado).
        </p>

        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {cargando && <p className="text-sm text-gray-500">Cargando catálogo…</p>}

        {!cargando && (
          <>
            <section>
              <h2 className="font-semibold text-gray-900 mb-3">
                Por revisar ({candidatos.length})
              </h2>
              {candidatos.length === 0 ? (
                <p className="text-sm text-gray-500 bg-white rounded-lg border border-gray-200 p-4">
                  No encontré decants y botellas que parezcan el mismo perfume sin estar vinculados.
                </p>
              ) : (
                <div className="space-y-3">
                  {candidatos.map(([d, b]) => (
                    <div key={parId(d, b)} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Ficha p={d} otro={b} />
                        <Ficha p={b} otro={d} />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          disabled={ocupado === parId(d, b)}
                          onClick={() => vincular(d, b)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[#A47E3B] text-white px-3 py-2 rounded-md hover:bg-[#8b6d32] disabled:opacity-50"
                        >
                          <Link2 size={15} /> Vincular con los datos del decant
                        </button>
                        <button
                          disabled={ocupado === parId(d, b)}
                          onClick={() => vincular(b, d)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold border border-[#A47E3B] text-[#A47E3B] px-3 py-2 rounded-md hover:bg-[#A47E3B]/10 disabled:opacity-50"
                        >
                          <Link2 size={15} /> Con los datos de la botella
                        </button>
                        <button
                          onClick={() => descartar(d, b)}
                          className="text-sm text-gray-500 px-3 py-2 hover:text-gray-800"
                        >
                          No son el mismo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <button
                onClick={() => setVerVinculados((v) => !v)}
                className="font-semibold text-gray-900 inline-flex items-center gap-2"
              >
                <Check size={18} className="text-green-600" />
                Ya vinculados ({vinculados.length}) {verVinculados ? "▴" : "▾"}
              </button>
              {verVinculados && (
                <ul className="mt-3 bg-white rounded-lg border border-gray-200 divide-y">
                  {vinculados.map(([d, b]) => (
                    <li key={parId(d, b)} className="px-4 py-2 text-sm flex justify-between gap-3">
                      <span className="truncate">
                        {d.nombre} <span className="text-gray-500">· {d.casa}</span>
                      </span>
                      <span className="shrink-0 text-gray-500">
                        decant ${formatPrecio(d.precio)}/ml · botella ${formatPrecio(b.precio)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
