import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { getAllPosts, deletePost, updatePost } from "../functions/getPosts";
import { useToast } from "../context/ToastContext";

export default function AdminBlogList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await getAllPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      showToast("Error al eliminar el post.", "error");
    }
  }

  async function togglePublicado(post) {
    try {
      const updated = await updatePost(post.id, { publicado: !post.publicado });
      setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
    } catch (err) {
      showToast("Error al cambiar el estado de publicación.", "error");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 hover:text-[#D4AF7A] transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Volver al panel</span>
          </button>
          <h1 className="text-lg sm:text-xl font-bold">
            Blog ({posts.length})
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => navigate("/admin/blog/nuevo")}
            className="flex items-center gap-2 bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Agregar post
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Cargando...</p>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">Aún no tienes posts.</p>
            <button
              onClick={() => navigate("/admin/blog/nuevo")}
              className="bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-5 py-2 rounded-md text-sm font-semibold transition-colors"
            >
              Escribir el primero
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.publicado
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.publicado ? "Publicado" : "Borrador"}
                      </span>
                      <span className="text-xs text-gray-400">
                        /blog/{p.slug}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 truncate">
                      {p.titulo}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(p.creado_en).toLocaleDateString("es-MX")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => togglePublicado(p)}
                      title={p.publicado ? "Despublicar" : "Publicar"}
                      className={`p-2 rounded-md transition-colors ${
                        p.publicado
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {p.publicado ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => navigate(`/admin/blog/${p.id}`)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {confirmDelete === p.id && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
                    <p className="text-sm text-red-700">
                      ¿Eliminar este post? No se puede deshacer.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
