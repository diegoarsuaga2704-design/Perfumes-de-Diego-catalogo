import { ShieldCheck, Package, MessageCircle } from "lucide-react";

function BadgesConfianza() {
  const badges = [
    {
      icono: ShieldCheck,
      texto: "100% Originales",
    },
    {
      icono: Package,
      texto: "Empaque seguro",
    },
    {
      icono: MessageCircle,
      texto: "Atención personalizada",
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-200">
      {badges.map((badge, index) => {
        const Icono = badge.icono;
        return (
          <div
            key={index}
            className="flex flex-col items-center text-center gap-1"
          >
            <Icono className="text-[#A47E3B]" size={20} />
            <span className="text-[10px] sm:text-xs text-gray-700 font-medium leading-tight">
              {badge.texto}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default BadgesConfianza;
