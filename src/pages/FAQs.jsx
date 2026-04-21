import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    pregunta: "¿Qué es un decant?",
    respuesta:
      "Un decant es una porción de perfume transferida desde un frasco original a un envase más pequeño. Te permite probar fragancias exclusivas sin invertir en un frasco completo, o llevar tu perfume favorito de forma práctica.",
  },
  {
    pregunta: "¿Los perfumes son 100% originales?",
    respuesta:
      "Sí. Todos nuestros perfumes son originales, adquiridos directamente de distribuidores autorizados. Puedes comprar con total confianza.",
  },
  {
    pregunta: "¿Cómo realizo mi pedido?",
    respuesta:
      'Agrega los perfumes a tu carrito, presiona "Realizar pedido" y automáticamente se abrirá WhatsApp con el detalle de tu compra. Desde ahí coordinamos el pago y el envío.',
  },
  {
    pregunta: "¿Qué métodos de pago aceptan?",
    respuesta:
      "Transferencia bancaria y depósito. Los detalles los compartimos por WhatsApp una vez confirmado el pedido.",
  },
  {
    pregunta: "¿Cuánto tarda el envío?",
    respuesta:
      "Los envíos a todo México tardan entre 2 y 5 días hábiles una vez confirmado el pago. Usamos paqueterías confiables con número de guía para que rastrees tu pedido.",
  },
  {
    pregunta: "¿Cuánto cuesta el envío?",
    respuesta:
      "El costo depende de tu código postal y el peso del paquete. Al hacer tu pedido te lo cotizamos sin compromiso.",
  },
  {
    pregunta: "¿Puedo pedir una muestra antes de comprar un frasco completo?",
    respuesta:
      "Sí, para eso existen los decants. Prueba desde 1 ml el perfume que te interese antes de invertir en una botella completa.",
  },
  {
    pregunta: "¿Qué pasa si mi pedido llega dañado?",
    respuesta:
      "Todos los pedidos viajan bien empacados. En el caso excepcional de que llegue dañado, escríbeme por WhatsApp con fotos en las primeras 24 horas y lo resolvemos juntos.",
  },
];

function FAQs() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-gray-100 py-12 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-[#A47E3B] text-3xl sm:text-4xl font-extrabold mb-2">
            Preguntas frecuentes
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Todo lo que necesitas saber antes de tu compra
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

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center text-left px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 text-sm sm:text-base pr-4">
                  {faq.pregunta}
                </span>
                <ChevronDown
                  className={`flex-shrink-0 text-[#A47E3B] transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  size={20}
                />
              </button>

              {openIndex === index && (
                <div className="px-5 pb-4 pt-1 text-gray-700 text-sm leading-relaxed border-t border-gray-100">
                  {faq.respuesta}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-gray-700 text-sm sm:text-base mb-3">
            ¿No encontraste lo que buscabas?
          </p>
          <a
            href="https://wa.me/5212212034647?text=Hola%20Diego%2C%20tengo%20una%20pregunta"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 bg-[#A47E3B] text-white rounded-md hover:bg-[#D4AF7A] transition-colors font-medium"
          >
            Escríbeme por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

export default FAQs;
