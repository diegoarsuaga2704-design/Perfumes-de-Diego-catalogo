import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../services/supabase";
import { decantsPreguntas, slugGuiaDecants } from "../data/decantsInfo";

const WHATSAPP = "5212212034647";

// Preguntas frecuentes debajo del catálogo de /decants.
export default function DecantsInfo() {
  const [slugGuia, setSlugGuia] = useState(null);
  useEffect(() => {
    slugGuiaDecants(supabase).then(setSlugGuia);
  }, []);

  const mensaje = "Hola Diego, ¿me recomiendas decants según los perfumes que ya uso?";

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-gray-700">
      <div className="space-y-6">
        {decantsPreguntas.map((p) => (
          <div key={p.pregunta}>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{p.pregunta}</h2>
            <p className="text-sm sm:text-base leading-relaxed">{p.respuesta}</p>
          </div>
        ))}
        <p className="text-sm sm:text-base leading-relaxed">
          ¿No sabes por dónde empezar? Lee la{" "}
          <Link
            to={slugGuia ? `/blog/${slugGuia}` : "/blog"}
            className="font-semibold text-[#A47E3B] hover:underline"
          >
            guía de decants
          </Link>{" "}
          del blog o{" "}
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#A47E3B] hover:underline"
          >
            escríbeme por WhatsApp
          </a>{" "}
          y te recomiendo según lo que ya usas.
        </p>
      </div>
    </section>
  );
}
