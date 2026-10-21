import { Link } from "react-router-dom";
import ComoFunciona from "../ui/ComoFunciona";
import HomeBrand from "../ui/HomeBrand";
import CTAWhatsApp from "../ui/CTAWhatsApp";
import TestimoniosSeccion from "../ui/TestimoniosSeccion";
import SEO from "../ui/SEO";
import GrupoWhatsApp from "../ui/GrupoWhatsApp";
import { getTemporada, TEXTOS_TEMPORADA } from "../functions/temporada";
import DecoracionTemporada from "../ui/DecoracionTemporada";


function Prehome() {
  const temporada = getTemporada();
  const collections = [
    {
      image:
        "https://xpxfacujdaiugphvpili.supabase.co/storage/v1/object/public/perfumsImages/o.rZpkAR0ZbQi.jpg",
      title: "Decants",
      to: "/decants",
      description:
        "Prueba tus perfumes favoritos antes de comprar el frasco completo.",
    },
    {
      image:
        "https://xpxfacujdaiugphvpili.supabase.co/storage/v1/object/public/perfumsImages/foto%20portada.jpeg",
      title: "Mejor vendidos",
      to: "/best-sellers",
      description: "Los favoritos de mis clientes.",
    },
    {
      image:
        "https://xpxfacujdaiugphvpili.supabase.co/storage/v1/object/public/perfumsImages/haec%20foto.webp",
      title: "Botellas completas y parciales",
      to: "/botellas",
      description: "Perfumes sellados y parciales disponibles.",
    },
  ];

  return (
    <div className="bg-gray-100">
      <SEO />
      <div className="relative text-[#A47E3B] text-center font-extrabold sm:text-3xl text-2xl px-14 py-4 subpixel-antialiased ">
        <DecoracionTemporada />
        <span
          style={
            temporada
              ? {
                  textDecoration: "underline",
                  textDecorationColor: TEXTOS_TEMPORADA[temporada].acento,
                  textDecorationThickness: "2px",
                  textUnderlineOffset: "8px",
                }
              : undefined
          }
        >
          Compra tus perfumes favoritos.
        </span>
      </div>
      {temporada && (
        <p className="text-center text-sm -mt-1 mb-3 px-6">
          <Link
            to="/temporada"
            className="font-semibold hover:underline"
            style={{ color: TEXTOS_TEMPORADA[temporada].acento }}
          >
            {temporada === "halloween" ? "🎃" : "🌼"} Ve la colección {TEXTOS_TEMPORADA[temporada].titulo.replace("Perfumes para ", "de ").replace("Aromas para ", "de ")} →
          </Link>
        </p>
      )}
      <GrupoWhatsApp variant="linea" />
      <div className="grid gap-6 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 max-w-6xl mx-auto p-6">
        {collections.map((item, index) => (
          <HomeBrand
            key={index}
            image={item.image}
            title={item.title}
            description={item.description}
            eager={index === 0}
            to={item.to}
          />
        ))}
      </div>
      <ComoFunciona />

      <TestimoniosSeccion />

      <div className="bg-white py-8 px-6 text-center border-t border-gray-100">
        <p className="text-gray-700 text-sm sm:text-base mb-2">
          ¿Tienes dudas antes de comprar?
        </p>
        <Link
          to="/faqs"
          className="inline-block text-[#A47E3B] font-semibold text-sm sm:text-base hover:underline"
        >
          Revisa nuestras preguntas frecuentes →
        </Link>
      </div>

      <CTAWhatsApp />
    </div>
  );
}

export default Prehome;
