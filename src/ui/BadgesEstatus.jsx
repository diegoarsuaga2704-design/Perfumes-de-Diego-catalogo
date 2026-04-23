function BadgesEstatus({ parfum }) {
  const badges = [];

  // Estatus de disponibilidad (prioridad alta)
  if (parfum.disponible === "Agotado") {
    badges.push({ texto: "AGOTADO", color: "bg-red-600" });
  } else if (parfum.disponible === "Próximamente") {
    badges.push({ texto: "PRÓXIMAMENTE", color: "bg-yellow-500" });
  }

  // Mejor vendido (gana sobre NUEVO)
  if (parfum.esBestSeller === true) {
    badges.push({ texto: "MEJOR VENDIDO", color: "bg-[#A47E3B]" });
  } else if (parfum.created_at && parfum.disponible !== "Próximamente") {
    // NUEVO: creado en últimos 15 días y no está Próximamente
    const dias =
      (new Date() - new Date(parfum.created_at)) / (1000 * 60 * 60 * 24);
    if (dias <= 15) {
      badges.push({ texto: "NUEVO", color: "bg-blue-600" });
    }
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {badges.map((badge, index) => (
        <span
          key={index}
          className={`${badge.color} text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md shadow-sm`}
        >
          {badge.texto}
        </span>
      ))}
    </div>
  );
}

export default BadgesEstatus;