import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { getAllParfumsAdmin, updateParfumAdmin } from "../functions/getParfumsAdmin";
import { esMismoPerfume } from "../functions/mismoPerfume";
import { imagenThumb } from "../functions/imagenThumb";

// Imágenes de Fragrantica (su CDN es fimgs.net).
const esFragrantica = (url) => /fimgs\.net|fragrantica\./i.test(url || "");

const etiqueta = (p) =>
  p.stock ? `Botella${p.mlBotella ? ` ${p.mlBotella} ml` : ""}` : "Decant";

// Decant y botella del mismo perfume se muestran juntos en la tienda, así que
// deben usar la misma foto. Esta pantalla muestra los que tienen fotos
// distintas para elegir con cuál se quedan todas sus versiones.
export default function AdminImagenes() {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState("");

  const cargar = () => {
    setCargando(true);
    getAllParfumsAdmin()
      .then((d) => setTodos(d))
      .catch(() => setError("No se pudo cargar el catálogo."))
      .finally(() => setCargando(false));
  };
  useEffect(cargar, []);

  // Grupos del mismo perfume con 2 o más fotos distintas.
  const grupos = useMemo(() => {
    const lista = [];
    for (const p of todos) {
      const g = lista.find((x) => x.filas.some((f) => esMismoPerfume(f, p)));
      if (g) g.filas.push(p);
      else lista.push({ filas: [p] });
    }
    return lista
      .map(({ filas }) => {
        const imagenes = [...new Set(filas.map((f) => f.image).filter(Boolean))];
        return { filas, imagenes };
      })
      .filter((g) => g.imagenes.length > 1);
  }, [todos]);

  // Grupos donde exactamente una de las fotos es de Fragrantica.
  const automaticos = grupos.filter(
    (g) => g.imagenes.filter(esFragrantica).length === 1,
  );

  const aplicar = async (lista) => {
    setOcupado(true);
    setMsg("");
    let cambiados = 0;
    try {
      for (const { filas, imagen } of lista) {
        for (const f of filas) {
          if (f.image === imagen) continue;
          await updateParfumAdmin(f.id, { image: imagen });
          cambiados++;
        }
      }
      setMsg(`Listo: ${cambiados} ${cambiados === 1 ? "perfume actualizado" : "perfumes actualizados"}.`);
      cargar();
    } catch {
      setMsg("No se pudo guardar. Revisa la conexión o los permisos.");
    } finally {
      setOcupado(false);
    }
  };

  const usarFragranticaEnTodos = () => {
    if (
      !window.confirm(
        `Se va a usar la foto de Fragrantica en ${automaticos.length} perfumes. ¿Continuar?`,
      )
    )
      return;
    aplicar(
      automaticos.map((g) => ({
        filas: g.filas,
        imagen: g.imagenes.find(esFragrantica),
      })),
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="p-2 hover:bg-gray-700 rounded-md">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold">Unificar fotos</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <p className="text-sm text-gray-600">
          El decant y la botella de un perfume se muestran juntos en la tienda. Aquí están los
          que tienen fotos distintas: elige con cuál se quedan y se aplica a todas sus versiones.
        </p>

        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {cargando && <p className="text-sm text-gray-500">Cargando catálogo…</p>}

        {!cargando && automaticos.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <p className="text-sm text-gray-700">
              En <strong>{automaticos.length}</strong> perfumes una de las fotos es de
              Fragrantica.
            </p>
            <button
              disabled={ocupado}
              onClick={usarFragranticaEnTodos}
              className="text-sm font-semibold bg-[#A47E3B] text-white px-4 py-2 rounded-md hover:bg-[#8b6d32] disabled:opacity-50"
            >
              Usar la de Fragrantica en todos
            </button>
          </div>
        )}

        {!cargando && (
          <section>
            <h2 className="font-semibold text-gray-900 mb-3">
              Con fotos distintas ({grupos.length})
            </h2>
            {grupos.length === 0 ? (
              <p className="text-sm text-gray-500 bg-white rounded-lg border border-gray-200 p-4 inline-flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                Todos los perfumes usan una sola foto.
              </p>
            ) : (
              <div className="space-y-3">
                {grupos.map((g) => (
                  <div
                    key={g.filas.map((f) => f.id).join("-")}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                  >
                    <p className="font-semibold text-gray-900">
                      {g.filas[0].nombre}{" "}
                      <span className="font-normal text-gray-500">· {g.filas[0].casa}</span>
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {g.imagenes.map((img) => (
                        <div
                          key={img}
                          className="w-40 rounded-lg border border-gray-200 p-2 flex flex-col"
                        >
                          <img
                            src={imagenThumb(img, 300)}
                            onError={(e) => {
                              if (e.currentTarget.src !== img) e.currentTarget.src = img;
                            }}
                            alt=""
                            className="h-36 w-full object-contain"
                          />
                          {esFragrantica(img) && (
                            <span className="mt-1 self-start text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                              Fragrantica
                            </span>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {g.filas
                              .filter((f) => f.image === img)
                              .map(etiqueta)
                              .join(", ")}
                          </p>
                          <button
                            disabled={ocupado}
                            onClick={() => aplicar([{ filas: g.filas, imagen: img }])}
                            className="mt-2 text-xs font-semibold border border-[#A47E3B] text-[#A47E3B] px-2 py-1.5 rounded-md hover:bg-[#A47E3B]/10 disabled:opacity-50"
                          >
                            Quedarme con esta
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
