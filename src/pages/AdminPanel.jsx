import { useNavigate } from "react-router-dom";
import { LogOut, Package, Plus, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header del admin */}
      <header className="bg-[#2C2C2C] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Panel de Admin</h1>
            <p className="text-xs text-gray-400">
              Conectado como: {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-[#A47E3B] hover:bg-[#D4AF7A] px-4 py-2 rounded-md text-sm font-semibold transition-colors"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido Diego
          </h2>
          <p className="text-gray-600">
            Desde aquí podrás administrar tu catálogo de perfumes sin necesidad
            de entrar a Supabase.
          </p>
        </div>

        {/* Tarjetas de funciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/admin/perfumes")}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md hover:border-[#A47E3B] transition-all text-left"
          >
            <Package className="text-[#A47E3B] mb-3" size={28} />
            <h3 className="font-semibold text-gray-900 mb-1">
              Ver y editar perfumes
            </h3>
            <p className="text-sm text-gray-600">
              Lista completa del catálogo con buscador
            </p>
          </button>

          <button
            onClick={() => navigate("/admin/perfumes/nuevo")}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md hover:border-[#A47E3B] transition-all text-left"
          >
            <Plus className="text-[#A47E3B] mb-3" size={28} />
            <h3 className="font-semibold text-gray-900 mb-1">
              Agregar perfume
            </h3>
            <p className="text-sm text-gray-600">
              Crear un perfume nuevo en el catálogo
            </p>
          </button>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 opacity-50">
            <ImageIcon className="text-[#A47E3B] mb-3" size={28} />
            <h3 className="font-semibold text-gray-900 mb-1">Subir fotos</h3>
            <p className="text-sm text-gray-600">Próximamente — Fase 5</p>
          </div>
        </div>
      </main>
    </div>
  );
}
