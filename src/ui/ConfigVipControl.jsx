import { useEffect, useState } from "react";
import supabase from "../services/supabase";

export default function ConfigVipControl() {
  const [cfg, setCfg] = useState({
    inversion_min: 15000,
    costo_sesion: 1100,
    costo_extra: 500,
  });
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("config_vip")
        .select("inversion_min, costo_sesion, costo_extra")
        .eq("id", 1)
        .single();
      if (data)
        setCfg({
          inversion_min: Number(data.inversion_min) || 15000,
          costo_sesion: Number(data.costo_sesion) || 1100,
          costo_extra: Number(data.costo_extra) || 500,
        });
      setCargando(false);
    })();
  }, []);

  const guardar = async () => {
    setMsg("");
    const { error } = await supabase
      .from("config_vip")
      .update({
        inversion_min: Number(cfg.inversion_min) || 0,
        costo_sesion: Number(cfg.costo_sesion) || 0,
        costo_extra: Number(cfg.costo_extra) || 0,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) {
      setMsg("No se pudo guardar. Revisa permisos (RLS) o conexión.");
    } else {
      setMsg("Guardado ✓");
      setTimeout(() => setMsg(""), 2500);
    }
  };

  const campo = (label, key, hint) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-gray-600">$</span>
        <input
          type="number"
          min="0"
          step="100"
          value={cfg[key]}
          onChange={(e) => setCfg((c) => ({ ...c, [key]: e.target.value }))}
          onBlur={guardar}
          className="w-40 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
        />
      </div>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  if (cargando) {
    return (
      <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
        <p className="text-sm text-gray-500">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
      <h3 className="font-bold text-gray-900">Experiencia Privada (VIP)</h3>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">
        Montos que ve el cliente en la página de experiencia privada.
      </p>
      <div className="flex flex-wrap gap-6 items-start">
        {campo("Inversión mínima en decants", "inversion_min", "Redimible")}
        {campo("Costo fijo de sesión (hasta 3)", "costo_sesion", "No redimible")}
        {campo("Costo por persona extra", "costo_extra", "A partir de la 4a")}
        {msg && <span className="text-xs text-gray-500 self-center">{msg}</span>}
      </div>
    </div>
  );
}