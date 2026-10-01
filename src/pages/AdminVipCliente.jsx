import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import supabase from "../services/supabase";

const hoy = () => new Date().toISOString().slice(0, 10);
const fmt = (n) => "$" + (Number(n) || 0).toLocaleString("es-MX");

const VEREDICTO_LABEL = { gusto: "Me gustó", tal_vez: "Tal vez", no: "No" };
const VEREDICTO_COLOR = {
  gusto: "bg-green-100 text-green-700",
  tal_vez: "bg-amber-100 text-amber-700",
  no: "bg-red-100 text-red-700",
};

// Formulario para marcar realizada una sesión, prellenado con lo que
// declaró el cliente (inversión) y su pedido final (gasto). Editable.
function CerrarSesion({ s, onCancelar, onCerrada }) {
  const [recarga, setRecarga] = useState(String(Number(s.inversion_declarada) || ""));
  const [filas, setFilas] = useState(() =>
    Array.isArray(s.pedido_final) && s.pedido_final.length > 0
      ? s.pedido_final.map((d) => ({
          nombre: d.nombre || "",
          ml: d.ml != null ? String(d.ml) : "",
          monto: d.monto != null ? String(d.monto) : "",
        }))
      : [{ nombre: "", ml: "", monto: "" }],
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const setFila = (i, campo, val) =>
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, [campo]: val } : f)));
  const gasto = filas.reduce((acc, f) => acc + (Number(f.monto) || 0), 0);

  const confirmar = async () => {
    setGuardando(true);
    setError("");
    const decants = filas
      .filter((f) => f.nombre.trim())
      .map((f) => ({
        nombre: f.nombre.trim(),
        ml: Number(f.ml) || null,
        monto: Number(f.monto) || 0,
      }));
    const { error: err } = await supabase
      .from("sesiones_vip")
      .update({
        estado: "realizada",
        recarga: Number(recarga) || 0,
        decants,
        gasto_decants: gasto,
      })
      .eq("id", s.id);
    setGuardando(false);
    if (err) {
      setError("No se pudo cerrar la sesión. Revisa permisos (RLS) o conexión.");
    } else {
      onCerrada();
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">Cerrar sesión</p>
      <p className="text-xs text-gray-500 mb-3">
        Prellenado con la inversión declarada y el pedido final del cliente. Ajusta lo
        que haga falta antes de confirmar; esto mueve el saldo.
      </p>
      <label className="block text-xs text-gray-500 mb-1">Inversión / recarga ($)</label>
      <input
        type="number"
        min="0"
        value={recarga}
        onChange={(e) => setRecarga(e.target.value)}
        className="w-40 border border-gray-300 rounded-md px-3 py-2 text-sm mb-3"
      />
      <label className="block text-xs text-gray-500 mb-1">Decants entregados</label>
      <div className="space-y-2">
        {filas.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={f.nombre}
              onChange={(e) => setFila(i, "nombre", e.target.value)}
              placeholder="Perfume"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={f.ml}
              onChange={(e) => setFila(i, "ml", e.target.value)}
              placeholder="ml"
              className="w-16 border border-gray-300 rounded-md px-2 py-2 text-sm"
            />
            <input
              type="number"
              value={f.monto}
              onChange={(e) => setFila(i, "monto", e.target.value)}
              placeholder="$"
              className="w-24 border border-gray-300 rounded-md px-2 py-2 text-sm"
            />
            <button
              onClick={() => setFilas((prev) => prev.filter((_, idx) => idx !== i))}
              className="text-gray-400 hover:text-red-600 px-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => setFilas((prev) => [...prev, { nombre: "", ml: "", monto: "" }])}
        className="mt-2 text-sm text-[#A47E3B] flex items-center gap-1 hover:underline"
      >
        <Plus size={14} /> Agregar decant
      </button>
      <p className="text-sm text-gray-600 mt-3">
        Recarga <strong>{fmt(recarga)}</strong> − Gasto <strong>{fmt(gasto)}</strong> ={" "}
        <strong>{fmt((Number(recarga) || 0) - gasto)}</strong> al saldo
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={confirmar}
          disabled={guardando}
          className="bg-[#A47E3B] text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-[#8b6d32] disabled:bg-gray-300"
        >
          {guardando ? "Guardando…" : "Confirmar y marcar realizada"}
        </button>
        <button onClick={onCancelar} className="text-sm text-gray-500 px-3">
          Cancelar
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}

export default function AdminVipCliente() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmarBorrar, setConfirmarBorrar] = useState(null);
  const [cerrandoId, setCerrandoId] = useState(null);

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
      estado: "realizada",
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          s.estado === "realizada"
                            ? "bg-gray-200 text-gray-600"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {s.estado === "realizada" ? "Realizada" : "Pendiente"}
                      </span>
                      {s.pedido_enviado && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Pedido enviado
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {s.fecha} · {s.num_personas}{" "}
                        {s.num_personas === 1 ? "persona" : "personas"}
                      </span>
                    </div>

                    {(Number(s.inversion_declarada) > 0 || s.lugar || s.preferencia || s.dia) && (
                      <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                        {Number(s.inversion_declarada) > 0 && (
                          <p>
                            Inversión declarada: <strong>{fmt(s.inversion_declarada)}</strong>
                          </p>
                        )}
                        {s.lugar && <p>Lugar: {s.lugar}</p>}
                        {s.preferencia && <p>Preferencia: {s.preferencia}</p>}
                        {s.dia && <p>Días: {s.dia}</p>}
                      </div>
                    )}

                    {s.estado === "realizada" && (
                      <p className="text-sm text-gray-700 mt-2">
                        Inversión: <strong>{fmt(s.recarga)}</strong> · Gasto:{" "}
                        <strong>{fmt(s.gasto_decants)}</strong>
                      </p>
                    )}

                    {s.anotaciones && Object.keys(s.anotaciones).length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          Notas del cliente
                        </p>
                        <ul className="space-y-1">
                          {Object.entries(s.anotaciones).map(([perf, n]) =>
                            n && (n.veredicto || n.nota) ? (
                              <li key={perf} className="text-xs text-gray-600">
                                <span className="font-medium text-gray-800">{perf}</span>
                                {n.veredicto && (
                                  <span
                                    className={`ml-2 px-1.5 py-0.5 rounded ${VEREDICTO_COLOR[n.veredicto] || ""}`}
                                  >
                                    {VEREDICTO_LABEL[n.veredicto] || n.veredicto}
                                  </span>
                                )}
                                {n.nota && <span className="block italic">{n.nota}</span>}
                              </li>
                            ) : null,
                          )}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(s.pedido_final) && s.pedido_final.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          Pedido final del cliente
                        </p>
                        <ul className="text-xs text-gray-600 list-disc pl-5">
                          {s.pedido_final.map((d, i) => (
                            <li key={i}>
                              {d.nombre}
                              {d.ml ? ` · ${d.ml} ml` : ""} — {fmt(d.monto)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {s.estado !== "realizada" && cerrandoId !== s.id && (
                      <button
                        onClick={() => setCerrandoId(s.id)}
                        className="mt-3 text-sm font-semibold text-[#A47E3B] border border-[#A47E3B] px-3 py-1.5 rounded-md hover:bg-[#faf6ef]"
                      >
                        Marcar como realizada
                      </button>
                    )}
                    {cerrandoId === s.id && (
                      <CerrarSesion
                        s={s}
                        onCancelar={() => setCerrandoId(null)}
                        onCerrada={() => {
                          setCerrandoId(null);
                          cargar();
                        }}
                      />
                    )}
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
                        {s.estado === "realizada" ? "Probó" : "Perfumes de interés"} ({s.perfumes.length}):{" "}
                        {s.perfumes.join(", ")}
                      </p>
                    )}
                    {s.perfumes_actualizado_en && (
                      <p className="text-[11px] font-semibold text-amber-700 mt-1">
                        El cliente modificó sus perfumes el{" "}
                        {new Date(s.perfumes_actualizado_en).toLocaleString("es-MX", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
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