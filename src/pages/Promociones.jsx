import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Tag } from "lucide-react";

const promociones = [
  {
    codigo: "DIAPERFUME",
    titulo: "10% de descuento en decants",
    descripcion:
      "Aplica automáticamente al introducir el código en el carrito. Válido únicamente en decants, no aplica en botellas completas.",
    badge: "Activo",
  },
];

function Promociones() {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (codigo) => {
    navigator.clipboard.writeText(codigo);
    setCopiedCode(codigo);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <section className="bg-gray-100 py-12 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-[#A47E3B] text-3xl sm:text-4xl font-extrabold mb-2">
            Promociones
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Aprovecha nuestros descuentos vigentes
          </p>
        </div>

        <div className="mb-6 text-right">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Ir al inicio
          </button>
        </div>

        {promociones.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            Por el momento no hay promociones activas. Vuelve pronto.
          </p>
        ) : (
          <div className="space-y-4">
            {promociones.map((promo, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-6"
              >
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Tag className="text-[#A47E3B]" size={20} />
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {promo.titulo}
                    </h2>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                    {promo.badge}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {promo.descripcion}
                </p>

                <div className="flex items-center gap-2 bg-gray-50 border border-dashed border-[#A47E3B] rounded-md p-3">
                  <span className="text-xs text-gray-500 uppercase font-medium">
                    Código:
                  </span>
                  <span className="flex-1 font-mono font-bold text-[#A47E3B] tracking-wider text-sm sm:text-base">
                    {promo.codigo}
                  </span>
                  <button
                    onClick={() => handleCopy(promo.codigo)}
                    className="flex items-center gap-1 px-3 py-1 bg-[#A47E3B] text-white rounded-md hover:bg-[#D4AF7A] transition-colors text-xs sm:text-sm"
                  >
                    {copiedCode === promo.codigo ? (
                      <>
                        <Check size={14} />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          <p className="font-semibold mb-1">¿Cómo usar un código?</p>
          <p className="leading-relaxed">
            Agrega productos a tu carrito, abre el carrito y escribe el código
            en el campo de descuento antes de realizar tu pedido.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Promociones;
