import { Helmet } from "react-helmet-async";

// Defaults base del sitio. Las páginas individuales pueden sobreescribir
// title, description, image, etc.
const SITE_NAME = "Perfumes de Diego";
const DEFAULT_TITLE =
  "Perfumes de Diego — Decants y botellas de perfumes nicho en México";
const DEFAULT_DESCRIPTION =
  "Decants y botellas de perfumes de nicho y de diseñador en México. Prueba antes de comprar el frasco completo. Envíos a todo el país.";
const DEFAULT_IMAGE =
  "https://xpxfacujdaiugphvpili.supabase.co/storage/v1/object/public/perfumsImages/foto%20portada.jpeg";
const SITE_URL = "https://perfumesdediego.com";

export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
  noindex = false,
  schema = null,
}) {
  // Si la página pasa un título propio, lo combinamos con el nombre del sitio.
  // Si no, usamos el default.
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const fullDescription = description || DEFAULT_DESCRIPTION;
  const fullImage = image || DEFAULT_IMAGE;
  const fullUrl = url || SITE_URL;

  return (
    <Helmet>
      {/* Básicos */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <link rel="canonical" href={fullUrl} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph (Facebook, WhatsApp, LinkedIn) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_MX" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />

      {/* JSON-LD para datos estructurados (Schema.org) */}
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
}