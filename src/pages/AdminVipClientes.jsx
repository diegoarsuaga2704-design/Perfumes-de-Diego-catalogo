import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Trash2 } from "lucide-react";
import supabase from "../services/supabase";

// Genera un username tipo "Diego-VIP-482" a partir del nombre.
function generarUsername(nombre) {
  const base =
    (nombre || "")
      .trim()
      .split(/\s+/)[0]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "") || "Cliente";
  const cap = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  const num = Math.floor(100 + Math.random() * 900);
  return `${cap}-VIP-${num}`;
}

export default function AdminVipClientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmarBorrar, setConfirmarBorrar] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const { data } = await supabase
      .from("clientes_vip")
      .select("id, username, nombre, telefono, activo, saldo, creado_en")
      .order("creado_en", { ascending: false });
    setClientes(data || []);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const agregar = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    setMsg("");
    // Genera username y reintenta si choca con uno existente.
    let ok = false;
    for (let intento = 0; intento < 5 && !ok; intento++) {
      const username = generarUsername(nombre);
      const { error } = await supabase.from("clientes_vip").insert({
        username,
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        activo: true,
      });
      if (!error) {
        ok = true;
        setMsg(`Cliente creado. Clave: ${username}`);
      } else if (!/duplicate|unique/i.test(error.message)) {
        setMsg("No se pudo crear. Revisa permisos (RLS) o conexión.");
        break;
      }
    }
    setGuardando(false);
    if (ok) {
      setNombre("");
      setTelefono("");
      cargar();
    }
  };

  const toggleActivo = async (c) => {
    await supabase
      .from("clientes_vip")
      .update({ activo: !c.activo })
      .eq("id", c.id);
    cargar();
  };

  const borrar = async (id) => {
    await supabase.from("clientes_vip").delete().eq("id", id);
    setConfirmarBorrar(null);
    cargar();
  };

  const copiar = (texto) => {
    try {
      navigator.clipboard.writeText(texto);
      setMsg(`Copiado: ${texto}`);
      setTimeout(() => setMsg(""), 2000);
    } catch {
      // sin portapapeles
    }
  };

  const fmt = (n) => "$" + (Number(n) || 0).toLocaleString("es-MX");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 hover:text-gray-300">
            <ArrowLeft size={20} /> Volver al panel
          </Link>
          <h1 className="text-lg font-bold">Clientes VIP</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Alta */}
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-1">Agregar cliente</h2>
          <p className="text-xs text-gray-500 mb-4">
            La clave de acceso se genera sola (ej. Diego-VIP-482). Comparte esa
            clave con el cliente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del cliente"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
            />
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Teléfono (opcional)"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
            />
            <button
              onClick={agregar}
              disabled={!nombre.trim() || guardando}
              className="bg-[#A47E3B] text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-[#8b6d32] disabled:bg-gray-300"
            >
              {guardando ? "Creando…" : "Agregar"}
            </button>
          </div>
          {msg && <p className="text-sm text-green-700 mt-3 font-medium">{msg}</p>}
        </div>

        {/* Lista */}
        {cargando ? (
          <p className="text-gray-500 text-sm">Cargando…</p>
        ) : clientes.length === 0 ? (
          <p className="text-gray-400 text-sm">Aún no hay clientes VIP.</p>
        ) : (
          <div className="space-y-2">
            {clientes.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-lg shadow p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">
                      {c.nombre}
                    </p>
                    {!c.activo && (
                      <span className="text-[10px] font-bold uppercase bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => copiar(c.username)}
                    className="text-sm text-[#A47E3B] flex items-center gap-1 hover:underline"
                    title="Copiar clave"
                  >
                    {c.username} <Copy size={13} />
                  </button>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.telefono ? c.telefono + " · " : ""}Saldo: {fmt(c.saldo)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => toggleActivo(c)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md border ${
                      c.activo
                        ? "border-gray-300 text-gray-600 hover:bg-gray-50"
                        : "border-green-300 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {c.activo ? "Desactivar" : "Activar"}
                  </button>
                  {confirmarBorrar === c.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => borrar(c.id)}
                        className="text-xs font-semibold text-white bg-red-600 px-2 py-1.5 rounded-md"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmarBorrar(null)}
                        className="text-xs text-gray-500 px-1"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmarBorrar(c.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Borrar cliente"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}