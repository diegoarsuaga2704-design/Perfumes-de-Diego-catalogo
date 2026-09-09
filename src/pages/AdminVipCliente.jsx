import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import supabase from "../services/supabase";

const hoy = () => new Date().toISOString().slice(0, 10);
const fmt = (n) => "$" + (Number(n) || 0).toLocaleString("es-MX");

export default function AdminVipCliente() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmarBorrar, setConfirmarBorrar] = useState(null);

  // Formulario de nueva sesión
  const [fecha, setFecha] = useState(hoy());
  const [numPersonas, setNumPersonas] = useState(1);
  const [recarga, setRecarga] = useState("");
  const [decants, setDecants] = useState([{ nombre: "", ml: "", monto: "" }]);
  const [perfumesTexto, setPerfumesTexto] = useState("");
  const [notas, setNotas] = useState("");

  const cargar = async () => {
    setCargando(true);
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from("clientes_vip").select("*").eq("id", id).single(),
      supabase
        .from("sesiones_vip")
        .select("*")
        .eq("cliente_id", id)
        .order("fecha", { ascending: false })
        .order("creado_en", { ascending: false }),
    ]);
    setCliente(c || null);
    setSesiones(s || []);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setDecant = (i, campo, val) =>
    setDecants((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, [campo]: val } : d)),
    );
  const agregarFila = () =>
    setDecants((prev) => [...prev, { nombre: "", ml: "", monto: "" }]);
  const quitarFila = (i) =>
    setDecants((prev) => prev.filter((_, idx) => idx !== i));

  const gastoDecants = decants.reduce(
    (s, d) => s + (Number(d.monto) || 0),
    0,
  );

  const guardarSesion = async () => {
    setGuardando(true);
    setMsg("");
    const perfumesArr = perfumesTexto
      .split(/[,\n]/)
      .map((x) => x.trim())
      .filter(Boolean);
    const decantsClean = decants
      .filter((d) => d.nombre.trim())
      .map((d) => ({
        nombre: d.nombre.trim(),
        ml: Number(d.ml) || null,
        monto: Number(d.monto) || 0,
      }));
    const { error } = await supabase.from("sesiones_vip").insert({
      cliente_id: id,
      fecha,
      num_personas: Number(numPersonas) || 1,
      perfumes: perfumesArr,
      decants: decantsClean,
      gasto_decants: gastoDecants,
      recarga: Number(recarga) || 0,
      notas: notas.trim() || null,
    });
    setGuardando(false);
    if (error) {
      setMsg("No se pudo guardar la sesión. Revisa permisos (RLS) o conexión.");
    } else {
      setMsg("Sesión registrada ✓");
      setFecha(hoy());
      setNumPersonas(1);
      setRecarga("");
      setDecants([{ nombre: "", ml: "", monto: "" }]);
      setPerfumesTexto("");
      setNotas("");
      cargar();
    }
  };

  const borrarSesion = async (sid) => {
    await supabase.from("sesiones_vip").delete().eq("id", sid);
    setConfirmarBorrar(null);
    cargar();
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p className="text-gray-500 text-sm">Cargando…</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p className="text-gray-600">Cliente no encontrado.</p>
        <Link to="/admin/vip" className="text-[#A47E3B] underline">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/admin/vip" className="flex items-center gap-2 hover:text-gray-300">
            <ArrowLeft size={20} /> Clientes VIP
          </Link>
          <h1 className="text-lg font-bold">Perfil del cliente</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Encabezado del cliente */}
        <div className="bg-white rounded-lg shadow p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{cliente.nombre}</h2>
            <p className="text-sm text-[#A47E3B]">{cliente.username}</p>
            {cliente.telefono && (
              <p className="text-sm text-gray-500">{cliente.telefono}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest text-gray-400">
              Saldo en tienda
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {fmt(cliente.saldo)}
            </p>
          </div>
        </div>

        {/* Registrar sesión */}
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Registrar sesión</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Personas</label>
              <input
                type="number"
                min="1"
                value={numPersonas}
                onChange={(e) => setNumPersonas(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Inversión / recarga ($)
              </label>
              <input
                type="number"
                min="0"
                value={recarga}
                onChange={(e) => setRecarga(e.target.value)}
                placeholder="Crédito prepagado"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Decants comprados */}
          <label className="block text-xs text-gray-500 mb-2">
            Decants comprados
          </label>
          <div className="space-y-2">
            {decants.map((d, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={d.nombre}
                  onChange={(e) => setDecant(i, "nombre", e.target.value)}
                  placeholder="Perfume"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={d.ml}
                  onChange={(e) => setDecant(i, "ml", e.target.value)}
                  placeholder="ml"
                  className="w-16 border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
                <input
                  type="number"
                  value={d.monto}
                  onChange={(e) => setDecant(i, "monto", e.target.value)}
                  placeholder="$"
                  className="w-24 border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
                <button
                  onClick={() => quitarFila(i)}
                  className="text-gray-400 hover:text-red-600 px-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={agregarFila}
            className="mt-2 text-sm text-[#A47E3B] flex items-center gap-1 hover:underline"
          >
            <Plus size={14} /> Agregar decant
          </button>

          <p className="text-sm text-gray-600 mt-3">
            Gasto en decants: <strong>{fmt(gastoDecants)}</strong>
          </p>

          {/* Perfumes elegidos / olidos */}
          <label className="block text-xs text-gray-500 mb-1 mt-4">
            Perfumes que probó / eligió (opcional)
          </label>
          <textarea
            rows={2}
            value={perfumesTexto}
            onChange={(e) => setPerfumesTexto(e.target.value)}
            placeholder="Separados por coma"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
          />

          <label className="block text-xs text-gray-500 mb-1 mt-4">
            Notas (opcional)
          </label>
          <textarea
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
          />

          <button
            onClick={guardarSesion}
            disabled={guardando}
            className="mt-4 bg-[#A47E3B] text-white px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-[#8b6d32] disabled:bg-gray-300"
          >
            {guardando ? "Guardando…" : "Guardar sesión"}
          </button>
          {msg && <p className="text-sm text-green-700 mt-3 font-medium">{msg}</p>}
        </div>

        {/* Historial */}
        <h3 className="font-bold text-gray-900 mb-3">
          Historial de sesiones ({sesiones.length})
        </h3>
        {sesiones.length === 0 ? (
          <p className="text-gray-400 text-sm">Aún no hay sesiones registradas.</p>
        ) : (
          <div className="space-y-3">
            {sesiones.map((s) => (
              <div key={s.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">
                      {s.fecha} · {s.num_personas}{" "}
                      {s.num_personas === 1 ? "persona" : "personas"}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      Inversión: <strong>{fmt(s.recarga)}</strong> · Gasto:{" "}
                      <strong>{fmt(s.gasto_decants)}</strong>
                    </p>
                    {Array.isArray(s.decants) && s.decants.length > 0 && (
                      <ul className="mt-2 text-sm text-gray-600 list-disc pl-5">
                        {s.decants.map((d, i) => (
                          <li key={i}>
                            {d.nombre}
                            {d.ml ? ` · ${d.ml} ml` : ""} — {fmt(d.monto)}
                          </li>
                        ))}
                      </ul>
                    )}
                    {Array.isArray(s.perfumes) && s.perfumes.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Probó: {s.perfumes.join(", ")}
                      </p>
                    )}
                    {s.notas && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        {s.notas}
                      </p>
                    )}
                  </div>
                  {confirmarBorrar === s.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => borrarSesion(s.id)}
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
                      onClick={() => setConfirmarBorrar(s.id)}
                      className="text-gray-400 hover:text-red-600 shrink-0"
                      title="Borrar sesión"
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