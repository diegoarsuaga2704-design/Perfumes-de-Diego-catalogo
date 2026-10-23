import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ExternalLink } from "lucide-react";
import supabase from "../services/supabase";
import { getAllParfumsAdmin } from "../functions/getParfumsAdmin";
import { normalizarTexto } from "../functions/normalizarTexto";
import { formatPrecio } from "../functions/formatPrecio";
import { imagenThumb } from "../functions/imagenThumb";

// Elegir a mano qué perfumes salen en la colección de temporada
// (/temporada). Se guarda en parfums.en_temporada.
export default function AdminTemporada() {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [soloElegidos, setSoloElegidos] = useState(false);
  const [guardando, setGuardando] = useState(null);

  useEffect(() => {
    getAllParfumsAdmin()
      .then(setTodos)
      .catch(() => setError("No se pudo cargar el catálogo."))
      .finally(() => setCargando(false));
  }, []);

  const faltaColumna = !cargando && todos.length > 0 && !("en_temporada" in todos[0]);
  const elegidos = todos.filter((p) => p.en_temporada);

  const lista = useMemo(() => {
    const q = normalizarTexto(busqueda).trim();
    return todos.filter(
      (p) =>
        (!soloElegidos || p.en_temporada) &&
        (!q || normalizarTexto(p.nombre).includes(q) || normalizarTexto(p.casa).includes(q)),
    );
  }, [todos, busqueda, soloElegidos]);

  const alternar = async (p) => {
    const valor = !p.en_temporada;
    setGuardando(p.id);
    setError("");
    const { error: err } = await supabase
      .from("parfums")
      .update({ en_temporada: valor })
      .eq("id", p.id);
    setGuardando(null);
    if (err) {
      setError("No se pudo guardar. ¿Ya corriste el SQL de la columna en_temporada?");
      return;
    }
    setTodos((prev) => prev.map((x) => (x.id === p.id ? { ...x, en_temporada: valor } : x)));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="p-2 hover:bg-gray-700 rounded-md">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-bold">Colección de temporada</h1>
            <p className="text-xs text-gray-400">{elegidos.length} elegidos</p>
          </div>
          <a
            href="/temporada"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs inline-flex items-center gap-1 text-[#D4AF7A] hover:underline"
          >
            Ver colección <ExternalLink size={13} />
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <p className="text-sm text-gray-600">
          Marca los perfumes que quieres en la colección de temporada (Halloween / Día de
          Muertos). Se guarda al tocar. Los agotados no se muestran aunque estén marcados. Si no
          marcas ninguno, la página elige sola.
        </p>

        {faltaColumna && (
          <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3">
            Falta correr el SQL que crea la columna <code>en_temporada</code> en Supabase. Hasta
            entonces no se puede guardar la selección.
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar perfume o casa…"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={soloElegidos}
              onChange={(e) => setSoloElegidos(e.target.checked)}
              className="w-4 h-4 accent-[#A47E3B]"
            />
            Ver solo los elegidos
          </label>
        </div>

        {cargando ? (
          <p className="text-sm text-gray-500">Cargando catálogo…</p>
        ) : (
          <ul className="bg-white rounded-lg border border-gray-200 divide-y">
            {lista.map((p) => (
              <li key={p.id}>
                <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={!!p.en_temporada}
                    disabled={guardando === p.id || faltaColumna}
                    onChange={() => alternar(p)}
                    className="w-5 h-5 accent-[#A47E3B] shrink-0"
                  />
                  {p.image ? (
                    <img
                      src={imagenThumb(p.image, 80)}
                      alt=""
                      className="w-9 h-9 object-cover rounded shrink-0"
                    />
                  ) : (
                    <span className="w-9 h-9 rounded bg-gray-100 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900 truncate">{p.nombre}</span>
                    <span className="block text-xs text-gray-500 truncate">
                      {p.casa} · {p.stock ? "Botella" : "Decant"} · ${formatPrecio(p.precio)}
                      {p.stock ? "" : "/ml"}
                    </span>
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      p.disponible === "Disponible"
                        ? "bg-emerald-100 text-emerald-700"
                        : p.disponible === "Agotado"
                          ? "bg-red-100 text-red-700"
                          : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    {p.disponible}
                  </span>
                </label>
              </li>
            ))}
            {lista.length === 0 && (
              <li className="px-4 py-6 text-sm text-gray-500 text-center">Sin resultados.</li>
            )}
          </ul>
        )}
      </main>
    </div>
  );
}
