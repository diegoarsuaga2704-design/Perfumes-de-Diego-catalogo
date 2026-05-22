function BadgesEstatus({ parfum }) {
  let badge = null;

  // Prioridad: AGOTADO > PRÓXIMAMENTE > MEJOR VENDIDO > NUEVO
  // Solo se muestra UNO. El más relevante para el cliente.
  if (parfum.disponible === "Agotado") {
    badge = { texto: "AGOTADO", color: "bg-red-600" };
  } else if (parfum.disponible === "Próximamente") {
    badge = { texto: "PRÓXIMAMENTE", color: "bg-sky-600" };
  } else if (parfum.esBestSeller === true) {
    badge = { texto: "MEJOR VENDIDO", color: "bg-[#A47E3B]" };
  } else if (parfum.created_at) {
    const dias =
      (new Date() - new Date(parfum.created_at)) / (1000 * 60 * 60 * 24);
    if (dias <= 15) {
      badge = { texto: "NUEVO", color: "bg-emerald-500" };
    }
  }

  if (!badge) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <span
        className={`${badge.color} text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md shadow-sm`}
      >
        {badge.texto}
      </span>
    </div>
  );
}

export default BadgesEstatus;