import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import LoadingSpinner from "../ui/LoadingSpinner";
import { getPostBySlug } from "../functions/getPosts";
import { slugify } from "../functions/slugify";

const SITE = "https://perfumesdediego.com";

const mdComponents = {
  h2: (p) => (
    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3" {...p} />
  ),
  h3: (p) => <h3 className="text-xl font-bold text-gray-900 mt-6 mb-2" {...p} />,
  p: (p) => <p className="mb-4 leading-relaxed text-[15px]" {...p} />,
  ul: (p) => <ul className="list-disc pl-6 mb-4 space-y-1" {...p} />,
  ol: (p) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...p} />,
  strong: (p) => <strong className="font-semibold" {...p} />,
  blockquote: (p) => (
    <blockquote
      className="border-l-4 border-[#A47E3B] pl-4 italic text-gray-600 my-4"
      {...p}
    />
  ),
  a: (p) => (
    <a
      className="text-[#A47E3B] underline hover:text-[#D4AF7A]"
      target="_blank"
      rel="noopener noreferrer"
      {...p}
    />
  ),
  img: (p) => <img className="rounded-lg my-4 w-full" loading="lazy" {...p} />,
};

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [estado, setEstado] = useState("loading"); // loading | ok | notfound | error

  useEffect(() => {
    let activo = true;
    setEstado("loading");
    (async () => {
      try {
        const data = await getPostBySlug(slug);
        if (!activo) return;
        if (!data) {
          setEstado("notfound");
        } else {
          setPost(data);
          setEstado("ok");
        }
      } catch {
        if (activo) setEstado("error");
      }
    })();
    return () => {
      activo = false;
    };
  }, [slug]);

  if (estado === "loading") return <LoadingSpinner />;

  if (estado === "notfound" || estado === "error") {
    return (
      <main className="max-w-2xl mx-auto px-5 py-20 text-center">
        <p className="text-gray-600 mb-6">
          {estado === "notfound"
            ? "No encontramos esta publicación."
            : "Ocurrió un error al cargar la publicación."}
        </p>
        <Link to="/blog" className="text-[#A47E3B] underline">
          ← Volver al blog
        </Link>
      </main>
    );
  }

  const url = `${SITE}/blog/${post.slug}`;
  const perfume = post.parfums;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titulo,
    description: post.extracto || undefined,
    image: post.imagen ? [post.imagen] : undefined,
    datePublished: post.creado_en,
    dateModified: post.actualizado_en || post.creado_en,
    author: { "@type": "Person", name: "Diego" },
    publisher: {
      "@type": "Organization",
      name: "Perfumes de Diego",
      logo: {
        "@type": "ImageObject",
        url: "https://xpxfacujdaiugphvpili.supabase.co/storage/v1/object/public/perfumsImages/perfumes-de-diego-letras-horizontal.png",
      },
    },
    mainEntityOfPage: url,
  };

  return (
    <>
      <Helmet>
        <title>{post.titulo} — Perfumes de Diego</title>
        {post.extracto && <meta name="description" content={post.extracto} />}
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${post.titulo} — Perfumes de Diego`} />
        {post.extracto && (
          <meta property="og:description" content={post.extracto} />
        )}
        {post.imagen && <meta property="og:image" content={post.imagen} />}
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
      </Helmet>

      <main className="max-w-2xl mx-auto px-5 py-12 md:py-16">
        <Link
          to="/blog"
          className="text-sm text-gray-500 hover:text-[#A47E3B] transition-colors"
        >
          ← Volver al blog
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-6">
          {post.titulo}
        </h1>

        {post.imagen && (
          <img
            src={post.imagen}
            alt={post.titulo}
            className="w-full rounded-xl mb-8 object-cover"
          />
        )}

        <article className="text-gray-800">
          <ReactMarkdown components={mdComponents}>
            {post.contenido}
          </ReactMarkdown>
        </article>

        {perfume && (
          <div className="mt-12 rounded-xl border border-[#A47E3B]/30 bg-[#A47E3B]/5 p-5 flex items-center gap-4">
            {perfume.image && (
              <img
                src={perfume.image}
                alt={perfume.nombre}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <p className="text-xs text-gray-500">Perfume de esta reseña</p>
              <p className="font-semibold text-gray-900">
                {perfume.nombre}
                {perfume.casa ? ` · ${perfume.casa}` : ""}
              </p>
            </div>
            <Link
              to={`/product/${slugify(perfume.nombre)}/${perfume.id}`}
              className="bg-[#A47E3B] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#8a6930] transition-colors whitespace-nowrap"
            >
              Verlo
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
