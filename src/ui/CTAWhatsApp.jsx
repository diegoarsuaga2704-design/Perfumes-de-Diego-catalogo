import { MessageCircle } from "lucide-react";

function CTAWhatsApp({
  titulo = "¿No sabes cuál elegir?",
  mensaje = "Cuéntame qué notas o estilo te gustan y te armo una recomendación personalizada.",
  whatsappText = "Hola Diego, necesito ayuda para elegir un perfume",
}) {
  const whatsappUrl = `https://wa.me/5212212034647?text=${encodeURIComponent(
    whatsappText,
  )}`;

  return (
    <section className="bg-gradient-to-br from-[#A47E3B] to-[#D4AF7A] py-12 sm:py-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-white text-2xl sm:text-3xl font-extrabold mb-3">
          {titulo}
        </h2>
        <p className="text-white/90 text-sm sm:text-base mb-6 leading-relaxed max-w-xl mx-auto">
          {mensaje}
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-[#A47E3B] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg"
        >
          <MessageCircle size={20} />
          Escríbeme por WhatsApp
        </a>
      </div>
    </section>
  );
}

export default CTAWhatsApp;
