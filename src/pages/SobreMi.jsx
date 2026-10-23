import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FaWhatsapp } from "react-icons/fa";
import { sobreMiIntro, sobreMiSecciones } from "../data/sobreMi";

// "**texto**" → <strong>texto</strong>
function conNegritas(texto) {
  return texto
    .split(/(\*\*[^*]+\*\*)/g)
    .map((parte, i) =>
      parte.startsWith("**") ? (
        <strong key={i}>{parte.slice(2, -2)}</strong>
      ) : (
        parte
      ),
    );
}

export default function SobreMi() {
  return (
    <>
      <Helmet>
        <title>Sobre mí — Perfumes de Diego</title>
        <meta
          name="description"
          content="Diego, amante de la perfumería nicho y artesanal. Decants desde 1 ml. Acceso a casas como Ensar Oud, Toskovat, Stephane Humbert Lucas y más."
        />
        <link rel="canonical" href="https://perfumesdediego.com/sobre-mi" />
      </Helmet>

      <main className="max-w-2xl mx-auto px-5 py-12 md:py-16 text-gray-800">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Sobre mí
        </h1>
        <p className="text-sm text-gray-500 mb-10">México</p>

        <section className="space-y-4 text-[15px] leading-relaxed">
          {sobreMiIntro.map((p, i) => (
            <p key={i}>{conNegritas(p)}</p>
          ))}
        </section>

        {sobreMiSecciones.map((sec) => (
          <div key={sec.titulo}>
            <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
              {sec.titulo}
            </h2>
            {sec.parrafos && (
              <section className="space-y-4 text-[15px] leading-relaxed">
                {sec.parrafos.map((p, i) => (
                  <p key={i}>{conNegritas(p)}</p>
                ))}
              </section>
            )}
            {sec.lista && (
              <ul className="space-y-3 text-[15px] leading-relaxed list-disc pl-5">
                {sec.lista.map((item, i) => (
                  <li key={i}>{conNegritas(item)}</li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div className="mt-14 p-6 bg-gray-50 border border-gray-200 rounded-xl">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Si quieres empezar
          </h2>
          <p className="text-[15px] text-gray-700 mb-5 leading-relaxed">
            Lo más fácil: escríbeme. Te ayudo a elegir según lo que ya conoces.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://wa.me/5212212034647"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1FB855] text-white font-semibold px-5 py-2.5 rounded-md text-sm transition-colors"
            >
              <FaWhatsapp size={18} />
              Escribir por WhatsApp
            </a>
            <Link
              to="/home"
              className="inline-flex items-center justify-center bg-[#A47E3B] hover:bg-[#D4AF7A] text-white font-semibold px-5 py-2.5 rounded-md text-sm transition-colors"
            >
              Ver el catálogo
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}