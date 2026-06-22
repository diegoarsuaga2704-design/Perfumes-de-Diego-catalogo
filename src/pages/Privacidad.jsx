import { Helmet } from "react-helmet-async";

export default function Privacidad() {
  return (
    <>
      <Helmet>
        <title>Aviso de privacidad — Perfumes de Diego</title>
        <meta
          name="description"
          content="Aviso de privacidad de Perfumes de Diego: qué datos personales recabamos, para qué los usamos y cómo ejercer tus derechos ARCO."
        />
        <link rel="canonical" href="https://perfumesdediego.com/privacidad" />
      </Helmet>

      <main className="max-w-2xl mx-auto px-5 py-12 md:py-16 text-gray-800">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Aviso de privacidad
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Última actualización: junio de 2026
        </p>

        <h2 className="text-xl font-bold text-gray-900 mb-4">
          1. Responsable de tus datos
        </h2>
        <section className="space-y-4 text-[15px] leading-relaxed">
          <p>
            Perfumes de Diego (en adelante, "nosotros"), con domicilio en
            Puebla, México, es responsable
            del tratamiento de tus datos personales conforme a la Ley Federal de
            Protección de Datos Personales en Posesión de los Particulares y su
            reglamento.
          </p>
        </section>

        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          2. Datos que recabamos
        </h2>
        <section className="space-y-4 text-[15px] leading-relaxed">
          <p>
            Para procesar tus pedidos y atender tus solicitudes podemos recabar:
            tu nombre, número de teléfono o WhatsApp, código postal y domicilio
            de entrega, y el correo electrónico que nos proporciones (por ejemplo,
            al pedir aviso de disponibilidad de un producto). No recabamos datos
            personales sensibles ni datos financieros a través del sitio.
          </p>
        </section>

        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          3. Para qué usamos tus datos
        </h2>
        <section className="space-y-4 text-[15px] leading-relaxed">
          <p>Finalidades primarias (necesarias para darte el servicio):</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Procesar, confirmar y dar seguimiento a tus pedidos.</li>
            <li>Calcular y coordinar el envío de tus productos.</li>
            <li>Comunicarnos contigo para aclarar dudas sobre tu compra.</li>
            <li>
              Notificarte cuando un producto que solicitaste vuelva a estar
              disponible.
            </li>
          </ul>
          <p>Finalidades secundarias (no necesarias, puedes negarte):</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Enviarte novedades, lanzamientos o promociones.</li>
          </ul>
          <p>
            Si no deseas que usemos tus datos para las finalidades secundarias,
            puedes indicárnoslo por WhatsApp o al correo de contacto; tu negativa
            no afecta la atención de tus pedidos.
          </p>
        </section>

        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          4. Con quién compartimos tus datos
        </h2>
        <section className="space-y-4 text-[15px] leading-relaxed">
          <p>
            No vendemos ni rentamos tus datos personales. Para operar el sitio
            utilizamos proveedores tecnológicos que actúan como encargados del
            tratamiento, entre ellos servicios de alojamiento y base de datos
            (como Vercel y Supabase) y empresas de paquetería para realizar los
            envíos. Estos terceros únicamente tratan tus datos para prestarnos su
            servicio y conforme a sus propias políticas de privacidad.
          </p>
        </section>

        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          5. Tus derechos ARCO
        </h2>
        <section className="space-y-4 text-[15px] leading-relaxed">
          <p>
            Tienes derecho a Acceder a tus datos personales, Rectificarlos cuando
            sean inexactos, Cancelarlos cuando consideres que no se requieren, y
            Oponerte a su tratamiento (derechos ARCO). También puedes revocar el
            consentimiento que nos hayas otorgado.
          </p>
          <p>
            Para ejercer cualquiera de estos derechos, escríbenos al correo
            argoperfume@gmail.com indicando tu nombre, el derecho que
            deseas ejercer y los datos involucrados. Te responderemos en los
            plazos que marca la ley.
          </p>
        </section>

        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          6. Cookies y tecnologías de análisis
        </h2>
        <section className="space-y-4 text-[15px] leading-relaxed">
          <p>
            El sitio puede usar cookies y tecnologías similares con fines de
            análisis de uso y mejora de la experiencia (por ejemplo, mediciones
            de tráfico de forma agregada y anónima). Puedes deshabilitar las
            cookies desde la configuración de tu navegador, considerando que
            algunas funciones podrían verse afectadas.
          </p>
        </section>

        <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4">
          7. Cambios a este aviso
        </h2>
        <section className="space-y-4 text-[15px] leading-relaxed">
          <p>
            Podemos actualizar este aviso de privacidad para reflejar cambios en
            nuestras prácticas o en la legislación. La versión vigente siempre
            estará disponible en esta página, con su fecha de última
            actualización.
          </p>
        </section>
      </main>
    </>
  );
}
