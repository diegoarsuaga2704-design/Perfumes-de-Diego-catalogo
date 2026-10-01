import supabase from "../services/supabase";

// Las sesiones VIP guardan los perfumes por nombre (lista de interés, notas y
// pedido final). Al renombrar un perfume se actualizan ahí también; si no, en
// la Experiencia Privada aparece como "No disponible" y pierde sus notas.
// Devuelve cuántas sesiones se actualizaron.
export default async function renombrarPerfumeVip(viejo, nuevo) {
  if (!viejo || !nuevo || viejo === nuevo) return 0;

  const { data, error } = await supabase
    .from("sesiones_vip")
    .select("id, perfumes, anotaciones, pedido_final");
  if (error) throw error;

  const renombrarLinea = (l) => (l?.nombre === viejo ? { ...l, nombre: nuevo } : l);
  let actualizadas = 0;

  for (const s of data || []) {
    const cambios = {};

    if (Array.isArray(s.perfumes) && s.perfumes.includes(viejo)) {
      cambios.perfumes = s.perfumes.map((p) => (p === viejo ? nuevo : p));
    }

    const an = s.anotaciones;
    if (an && typeof an === "object") {
      const tieneNota = Object.prototype.hasOwnProperty.call(an, viejo);
      const extras = Array.isArray(an.__extras) ? an.__extras : null;
      const tieneExtra = extras?.some((e) => e?.nombre === viejo);
      if (tieneNota || tieneExtra) {
        const nuevas = { ...an };
        if (tieneNota) {
          nuevas[nuevo] = an[viejo];
          delete nuevas[viejo];
        }
        if (tieneExtra) nuevas.__extras = extras.map(renombrarLinea);
        cambios.anotaciones = nuevas;
      }
    }

    if (Array.isArray(s.pedido_final) && s.pedido_final.some((l) => l?.nombre === viejo)) {
      cambios.pedido_final = s.pedido_final.map(renombrarLinea);
    }

    if (Object.keys(cambios).length > 0) {
      const { error: errUpd } = await supabase
        .from("sesiones_vip")
        .update(cambios)
        .eq("id", s.id);
      if (errUpd) throw errUpd;
      actualizadas++;
    }
  }

  return actualizadas;
}
