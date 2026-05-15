import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getAvisosStock,
  marcarAvisoNotificado,
  desmarcarAvisoNotificado,
  deleteAvisoStock,
} from "../functions/getAvisosStock";
import LoadingSpinner from "../ui/LoadingSpinner";

export default function AdminAvisos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pendientes");

  useEffect(() => {
    fetchAvisos();
  }, []);

  const fetchAvisos = async () => {
    setLoading(true);
    const data = await getAvisosStock();
    setAvisos(data);
    setLoading(false);
  };

  const avisosFiltrados = avisos.filter((a) => {
    if (filter === "pendientes") return a.notificado_en === null;
    if (filter === "notificados") return a.notificado_en !== null;
    return true;
  });

  const handleMarcarNotificado = async (id) => {
    try {
      await marcarAvisoNotificado(id);
      await fetchAvisos();
    } catch {
      alert("Error al marcar como notificado.");
    }
  };

  const handleDesmarcarNotificado = async (id) => {
    try {
      await desmarcarAvisoNotificado(id);
      await fetchAvisos();
    } catch {
      alert("Error al desmarcar.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Borrar este aviso definitivamente?")) return;
    try {
      await deleteAvisoStock(id);
      await fetchAvisos();
    } catch {
      alert("Error al borrar.");
    }
  };

  const handleOpenWhatsApp = (aviso) => {
    const numeroLimpio = aviso.whatsapp.replace(/\D/g, "");
    // Si el número ya viene con 52, no lo duplicamos
    const numeroConPrefijo = numeroLimpio.startsWith("52")
      ? numeroLimpio
      : `52${numeroLimpio}`;
    const mensaje = `Hola! Te escribo de Perfumes de Diego. Pediste que te avisara cuando llegara ${aviso.parfum_nombre}${
      aviso.parfum_casa ? ` de ${aviso.parfum_casa}` : ""
    }. ¡Ya está disponible!`;
    const url = `https://wa.me/${numeroConPrefijo}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "";
    const d = new Date(fecha);
    return d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const conteoPendientes = avisos.filter((a) => a.notificado_en === null).length;
  const conteoNotificados = avisos.filter((a) => a.notificado_en !== null).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#2C2C2C] text-white shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/admin")}
            className="p-2 hover:bg-gray-700 rounded-md transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Avisos de stock</h1>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: "pendientes", label: "Pendientes", count: conteoPendientes },
            { value: "notificados", label: "Notificados", count: conteoNotificados },
            { value: "todos", label: "Todos", count: avisos.length },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === opt.value
                  ? "bg-[#A47E3B] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {opt.label} ({opt.count})
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : avisosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Bell className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">No hay avisos en esta categoría.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {avisosFiltrados.map((aviso) => {
              const esNotificado = aviso.notificado_en !== null;
              return (
                <div
                  key={aviso.id}
                  className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
                    esNotificado ? "border-green-500" : "border-sky-500"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            esNotificado
                              ? "bg-green-100 text-green-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {esNotificado ? "Notificado" : "Pendiente"}
                        </span>
                        <span className="text-xs text-gray-500">
                          Solicitado: {formatFecha(aviso.created_at)}
                        </span>
                        {esNotificado && (
                          <span className="text-xs text-gray-500">
                            · Notificado: {formatFecha(aviso.notificado_en)}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 truncate">
                        {aviso.parfum_nombre}
                      </p>
                      {aviso.parfum_casa && (
                        <p className="text-sm text-gray-500">
                          {aviso.parfum_casa}
                        </p>
                      )}
                      <div className="mt-2 text-sm text-gray-700 space-y-0.5">
                        <p>
                          📱 WhatsApp:{" "}
                          <span className="font-mono">{aviso.whatsapp}</span>
                        </p>
                        {aviso.email && <p>✉️ Email: {aviso.email}</p>}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(aviso)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md"
                      >
                        <MessageCircle size={14} />
                        WhatsApp
                      </button>
                      {!esNotificado ? (
                        <button
                          type="button"
                          onClick={() => handleMarcarNotificado(aviso.id)}
                          className="flex items-center gap-1 bg-[#A47E3B] hover:bg-[#D4AF7A] text-white text-xs font-semibold px-3 py-1.5 rounded-md"
                        >
                          <CheckCircle size={14} />
                          Marcar notificado
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDesmarcarNotificado(aviso.id)}
                          className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-md"
                        >
                          Pasar a pendiente
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(aviso.id)}
                        className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-3 py-1.5 rounded-md border border-red-200"
                      >
                        <Trash2 size={14} />
                        Borrar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}