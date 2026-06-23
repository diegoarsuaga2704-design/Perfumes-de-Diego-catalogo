import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  createPost,
  updatePost,
  getPostById,
  getPerfumesMini,
} from "../functions/getPosts";
import { slugify } from "../functions/slugify";
import ImageUploader from "../ui/ImageUploader";

const VACIO = {
  titulo: "",
  slug: "",
  extracto: "",
  contenido: "",
  imagen: "",
  perfume_id: null,
  publicado: false,
};

export default function AdminBlogForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editando = Boolean(id);

  const [form, setForm] = useState(VACIO);
  const [perfumes, setPerfumes] = useState([]);
  const [perfumeNombre, setPerfumeNombre] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      const lista = await getPerfumesMini();
      if (!activo) return;
      setPerfumes(lista);

      if (editando) {
        try {
          const post = await getPostById(id);
          if (!activo) return;
          setForm({
            titulo: post.titulo || "",
            slug: post.slug || "",
            extracto: post.extracto || "",
            contenido: post.contenido || "",
            imagen: post.imagen || "",
            perfume_id: post.perfume_id || null,
            publicado: post.publicado || false,
          });
          setSlugTouched(true);
          if (post.perfume_id) {
            const pf = lista.find((p) => p.id === post.perfume_id);
            if (pf) setPerfumeNombre(pf.nombre);
          }
        } catch {
          if (activo) setError("No se pudo cargar el post.");
        }
      }
      if (activo) setLoadingInit(false);
    })();
    return () => {
      activo = false;
    };
  }, [id, editando]);

  function handleTituloChange(e) {
    const titulo = e.target.value;
    setForm((prev) => ({
      ...prev,
      titulo,
      slug: slugTouched ? prev.slug : slugify(titulo),
    }));
  }

  function handleSlugChange(e) {
    setSlugTouched(true);
    setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handlePerfumeChange(e) {
    const val = e.target.value;
    setPerfumeNombre(val);
    const match = perfumes.find((p) => p.nombre === val);
    setForm((prev) => ({ ...prev, perfume_id: match ? match.id : null }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const slug = slugify(form.slug || form.titulo);
    if (!form.titulo.trim() || !slug || !form.contenido.trim()) {
      setError("El título, el slug y el contenido son obligatorios.");
      return;
    }

    const payload = {
      titulo: form.titulo.trim(),
      slug,
      extracto: form.extracto.trim() || null,
      contenido: form.contenido,
      imagen: form.imagen.trim() || null,
      perfume_id: form.perfume_id || null,
      publicado: form.publicado,
    };

    try {
      setSaving(true);
      if (editando) {
        await updatePost(id, payload);
      } else {
        await createPost(payload);
      }
      navigate("/admin/blog");
    } catch (err) {
      if (err?.code === "23505") {
        setError("Ya existe un post con ese slug. Cámbialo por uno único.");
      } else {
        setError("Error al guardar el post. Intenta de nuevo.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loadingInit) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/blog")}
            className="flex items-center gap-2 hover:text-[#D4AF7A] transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Volver</span>
          </button>
          <h1 className="text-lg sm:text-xl font-bold">
            {editando ? "Editar post" : "Nuevo post"}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md p-6 sm:p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={handleTituloChange}
              placeholder="Ej: ¿Vale la pena Aventus de Creed?"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Slug (URL)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">/blog/</span>
              <input
                type="text"
                value={form.slug}
                onChange={handleSlugChange}
                placeholder="vale-la-pena-aventus"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Se genera solo del título; puedes editarlo. Debe ser único.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Extracto{" "}
              <span className="text-gray-400 font-normal">(resumen corto)</span>
            </label>
            <textarea
              name="extracto"
              value={form.extracto}
              onChange={handleChange}
              rows={2}
              placeholder="Aparece en la lista y como descripción en Google."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#A47E3B] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Contenido (Markdown)
            </label>
            <textarea
              name="contenido"
              value={form.contenido}
              onChange={handleChange}
              rows={14}
              placeholder={"## Subtítulo\n\nTexto normal con **negritas**.\n\n- Punto uno\n- Punto dos"}
              className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Markdown: <code>## Subtítulo</code>, <code>**negrita**</code>,{" "}
              <code>- lista</code>, <code>[texto](url)</code>.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Imagen de portada{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <ImageUploader
              value={form.imagen}
              onChange={(url) => setForm((prev) => ({ ...prev, imagen: url }))}
              bucket="perfumsImages"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Perfume vinculado{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              list="perfumes-datalist"
              value={perfumeNombre}
              onChange={handlePerfumeChange}
              placeholder="Escribe para buscar un perfume..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
            />
            <datalist id="perfumes-datalist">
              {perfumes.map((p) => (
                <option key={p.id} value={p.nombre} />
              ))}
            </datalist>
            <p className="text-xs text-gray-500 mt-1">
              Si lo vinculas, al final del post aparece un botón para verlo.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="publicado"
              name="publicado"
              checked={form.publicado}
              onChange={handleChange}
              className="w-4 h-4 accent-[#A47E3B]"
            />
            <label htmlFor="publicado" className="text-sm text-gray-700">
              Publicado (visible en el sitio). Si lo dejas apagado, queda como
              borrador.
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/admin/blog")}
              className="px-5 py-2 border border-gray-300 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-6 py-2 rounded-md text-sm font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "Guardar post"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
