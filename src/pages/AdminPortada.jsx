import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ImageUploader from "../ui/ImageUploader";
import {
  TARJETAS_PORTADA,
  getFotosPortada,
  guardarFotoPortada,
} from "../functions/portada";

// Cambia las fotos de las 3 tarjetas de la portada (Decants, Mejor vendidos,
// Botellas). Cada foto se guarda al subirla.
export default function AdminPortada() {
  const navigate = useNavigate();
  const [fotos, setFotos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getFotosPortada()
      .then(setFotos)
      .finally(() => setCargando(false));
  }, []);

  const guardar = async (clave, imagen, titulo) => {
    setMsg("");
    setError("");
    try {
      await guardarFotoPortada(clave, imagen);
      setFotos((prev) => ({ ...prev, [clave]: imagen }));
      setMsg(
        imagen
          ? `Foto de "${titulo}" guardada.`
          : `"${titulo}" regresó a su foto original.`,
      );
    } catch {
      setError("No se pudo guardar. Revisa la conexión o los permisos.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="p-2 hover:bg-gray-700 rounded-md">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold">Fotos de la portada</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <p className="text-sm text-gray-600">
          Son las 3 tarjetas grandes de la página principal. Al subir una foto se guarda y se
          ve en la tienda de inmediato. La tarjeta recorta los bordes de la foto para llenar el
          espacio, así que deja lo importante al centro.
        </p>

        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {cargando && <p className="text-sm text-gray-500">Cargando…</p>}

        {!cargando && (
          <div className="grid gap-4 md:grid-cols-3">
            {TARJETAS_PORTADA.map((t) => {
              const propia = fotos[t.clave];
              return (
                <div key={t.clave} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <h2 className="font-semibold text-gray-900">{t.title}</h2>
                  <img
                    src={propia || t.image}
                    alt={t.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <ImageUploader
                    value={null}
                    onChange={(url) => url && guardar(t.clave, url, t.title)}
                    bucket="perfumsImages"
                  />
                  {propia && (
                    <button
                      onClick={() => guardar(t.clave, null, t.title)}
                      className="text-xs text-gray-500 hover:text-red-600 underline"
                    >
                      Regresar a la foto original
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
