import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TARJETAS_PORTADA, leerFotosCache, getFotosPortada } from "../functions/portada";
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
  // Fotos de las tarjetas: las guardadas en /admin/portada o las de siempre.
  // Mientras se consultan (primera visita) se muestra un fondo gris para no
  // enseñar una foto y luego cambiarla.
  const [fotos, setFotos] = useState(leerFotosCache);
  useEffect(() => {
    let cancelado = false;
    getFotosPortada().then((f) => {
      if (!cancelado) setFotos(f);
    });
    return () => {
      cancelado = true;
    };
  }, []);
  const collections = TARJETAS_PORTADA.map((t) => ({
    ...t,
    image: fotos ? fotos[t.clave] || t.image : null,
  }));

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
