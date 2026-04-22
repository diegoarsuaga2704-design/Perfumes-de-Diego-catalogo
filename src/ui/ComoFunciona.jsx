import { Search, TestTube, MessageCircle } from "lucide-react";

function ComoFunciona() {
  const pasos = [
    {
      icono: Search,
      numero: "1",
      titulo: "Elige tu perfume",
      descripcion: "Más de 150 opciones de casas nicho y exclusivas.",
    },
    {
      icono: TestTube,
      numero: "2",
      titulo: "Prueba desde 1 ml",
      descripcion:
        "O llévate la botella completa si ya conoces el perfume que amas.",
    },
    {
      icono: MessageCircle,
      numero: "3",
      titulo: "Cerramos por WhatsApp",
      descripcion:
        "Coordinamos pago y envío de forma personalizada contigo.",
    },
  ];

  return (
    <section className="bg-white py-12 sm:py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-[#A47E3B] text-2xl sm:text-3xl font-extrabold mb-2">
            Así funciona
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Comprar perfumes nicho nunca había sido tan simple
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {pasos.map((paso, index) => {
            const Icono = paso.icono;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#A47E3B] rounded-full flex items-center justify-center shadow-md">
                    <Icono className="text-white" size={32} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border-2 border-[#A47E3B] text-[#A47E3B] rounded-full flex items-center justify-center font-bold text-sm">
                    {paso.numero}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {paso.titulo}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                  {paso.descripcion}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ComoFunciona;