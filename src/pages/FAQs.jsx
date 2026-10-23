import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import SEO from "../ui/SEO";
import { faqs } from "../data/faqs";
import { garantias } from "../data/garantias";

function FAQs() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-gray-100 py-12 min-h-screen">
      <SEO
        title="Preguntas frecuentes"
        description="¿Qué es un decant? ¿Son originales? ¿Cuánto tarda el envío? Todas las dudas frecuentes resueltas."
      />
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-[#A47E3B] text-3xl sm:text-4xl font-extrabold mb-2">
            Preguntas frecuentes
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Todo lo que necesitas saber antes de tu compra
          </p>
        </div>

        {/* Cómo trabajo: garantías concretas (mismo texto que leen Google y las IAs) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Cómo trabajo</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {garantias.map((g) => (
              <li key={g.titulo}>
                <p className="font-semibold text-gray-900 text-sm">{g.titulo}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{g.texto}</p>
              </li>
            ))}
          </ul>
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
            <button
            onClick={() => {
              window.open(
                "https://wa.me/5212212034647?text=Hola%20Diego%2C%20tengo%20una%20pregunta",
                "_blank",
                "noopener,noreferrer"
              );
            }}
            className="inline-block px-6 py-2 bg-[#A47E3B] text-white rounded-md hover:bg-[#D4AF7A] transition-colors font-medium"
          >
            Escríbeme por WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
}

export default FAQs;
