import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FaWhatsapp } from "react-icons/fa";

export default function SobreMi() {
  return (
    <>
      <Helmet>
        <title>Sobre mí — Perfumes de Diego</title>
        <meta
          name="description"
          content="Diego, amante de la perfumería nicho y artesanal. Decants desde 1 ml. Acceso a casas como Ensar Oud, Toskovat, Stephane Humbert Lucas y más."
        />
        <link rel="canonical" href="https://perfumes-de-diego-catalogo.vercel.app/sobre-mi" />
      </Helmet>

      <main className="max-w-2xl mx-auto px-5 py-12 md:py-16 text-gray-800">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Sobre mí
        </h1>
        <p className="text-sm text-gray-500 mb-10">México</p>

        <section className="space-y-4 text-[15px] leading-relaxed">
          <p>
            Me llamo Diego. Soy ingeniero automotriz de profesión, no perfumista.
            Lo cuento al inicio porque me parece importante: no tengo
            certificaciones en perfumería, no estudié química olfativa, no
            trabajo para ninguna casa.
          </p>
          <p>
            Lo que sí tengo: varios años oliendo perfumes en serio. Comprando
            frascos completos, comprando muestras, comparando, equivocándome y
            aprendiendo de los errores. Lo suficiente para tener un criterio
            formado sobre qué vale la pena y qué no.
          </p>
        </section>

        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          Por qué empecé esto
        </h2>
        <section className="space-y-4 text-[15px] leading-relaxed">
          <p>
            Por una razón concreta: en México es difícil acceder a perfumería de
            nicho real. Las tiendas departamentales venden lo mismo que llevan
            vendiendo veinte años. Las perfumerías online masivas tienen
            catálogos enormes pero sin algo realmente propositivo. Y casas como Ensar Oud,
            Toskovat, Filippo Sorcinelli o Areej Le Doré prácticamente no
            llegan al país.
          </p>
          <p>
            Empecé comprando para mí. Después amigos me pidieron decants.
            Después más gente me empezó a escribir por TikTok. En algún momento
            dejó de ser solo mi colección y se volvió un proyecto.
          </p>
        </section>

        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          Cómo funciono
        </h2>
        <ul className="space-y-3 text-[15px] leading-relaxed list-disc pl-5">
          <li>
            Vendo <strong>decants desde 1 ml</strong>. Permite probar perfumes
            caros sin pagar el frasco completo.
          </li>
          <li>También vendo botellas completas y parciales.</li>
          <li>
            Compro todo de distribuidores autorizados. <strong>Originales 100%.</strong>
          </li>
          <li>
            La venta se cierra por WhatsApp. No hay carrito automático sin
            contacto humano: si tienes una duda, me llega a mí directo.
          </li>
          <li>
            Si no sabes qué elegir, te ayudo. Cuéntame qué te gusta o qué
            perfume conoces que ya uses, y te recomiendo algo especial para tí.
          </li>
          <li>Envíos a todo México, 1-5 días hábiles.</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          Lo que no soy
        </h2>
        <ul className="space-y-3 text-[15px] leading-relaxed list-disc pl-5">
          <li>No soy perfumista profesional.</li>
          <li>No soy "el experto #1". Sigo aprendiendo.</li>
          <li>No vendo lo que no usaría yo mismo.</li>
          <li>
            No exagero en las descripciones. Si un perfume no me gustó, lo digo.
          </li>
        </ul>

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