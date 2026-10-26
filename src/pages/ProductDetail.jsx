import { useParams, useNavigate, Link } from "react-router-dom";
import { slugify } from "../functions/slugify";
import { useEffect, useState, useRef } from "react";
import { ShoppingCart, ArrowLeft, CheckCircle } from "lucide-react";
import { getParfumById, getParfumsByIds } from "../functions/getParfums";
import {
  calcularPrecioDecant,
  precioPromo,
  getOpcionesMililitros,
} from "../functions/pricingDecant";
import { formatPrecio } from "../functions/formatPrecio";
import { imagenThumb } from "../functions/imagenThumb";
import { formatNota } from "../functions/formatNotas";
import { esMismoPerfume } from "../functions/mismoPerfume";
import { useParfums } from "../context/ParfumsContext";
import { registrarVisto } from "../functions/vistosRecientes";
import { track } from "@vercel/analytics";
import LoadingSpinner from "../ui/LoadingSpinner";
import CTAWhatsApp from "../ui/CTAWhatsApp";
import BadgesConfianza from "../ui/BadgesConfianza";
import BadgesEstatus from "../ui/BadgesEstatus";
import AvisameFormulario from "../ui/AvisameFormulario";
import PerfumesRelacionados from "../ui/PerfumesRelacionados";
import RecentlyViewed from "../ui/RecentlyViewed";
import TestimoniosSeccion from "../ui/TestimoniosSeccion";
import { useCart } from "../context/CartContext";
import { MAX_BOTELLAS } from "../functions/limitesCarrito";
import CustomSelect from "../ui/CustomSelect";
import SEO from "../ui/SEO";
import { getPostDePerfume } from "../functions/getPosts";
import {
  tituloSeoProducto,
  metaDescripcionProducto,
  parrafosDescripcion,
} from "../functions/seoProducto";

// Disponibles primero, luego próximamente, al final agotados.
const ordenDisponible = (p) =>
  ({ Disponible: 0, Próximamente: 1 })[p.disponible] ?? 2;

// Botón de opción (botella o tamaño de decant), estilo "chip".
function Opcion({ titulo, detalle, activa, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={activa}
      className={`min-w-[4.75rem] rounded-xl border px-4 py-2 text-left transition-colors ${
        activa
          ? "border-[#A47E3B] bg-[#A47E3B] text-white shadow-sm"
          : disabled
            ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
            : "border-gray-300 bg-white text-gray-800 hover:border-[#A47E3B]"
      }`}
    >
      <span className={`block text-sm font-semibold ${disabled ? "line-through" : ""}`}>
        {titulo}
      </span>
      {detalle && (
        <span
          className={`block text-xs ${
            activa ? "text-white/85" : disabled ? "text-gray-300" : "text-gray-500"
          }`}
        >
          {detalle}
        </span>
      )}
    </button>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parfum, setParfum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Opción elegida: { tipo: "botella", id } o { tipo: "decant", ml }.
  const [seleccion, setSeleccion] = useState(null);
  // Filas completas del mismo perfume en otros formatos (botella ↔ decant).
  const [variantes, setVariantes] = useState([]);
  const [botellas, setBotellas] = useState(1);
  const [added, setAdded] = useState(false);
  const [yaAgrego, setYaAgrego] = useState(false);
  const addBlockRef = useRef(null);
  const [mostrarFloating, setMostrarFloating] = useState(false);
  const finRef = useRef(null);
  const [finVisible, setFinVisible] = useState(false);
  const [imgOriginal, setImgOriginal] = useState(false);

  // Si cambia el producto, vuelve a intentar la versión optimizada (wsrv).
  useEffect(() => {
    setImgOriginal(false);
  }, [parfum?.image]);
  const { addToCart, openCart } = useCart();
  const { parfums: catalogo = [], minDecantSiempre = 0 } = useParfums() || {};

  // Ids del mismo perfume en otro formato (el catálogo trae todos los perfumes).
  const idsVariantes = parfum
    ? catalogo
        .filter((p) => esMismoPerfume(parfum, p))
        .map((p) => p.id)
        .sort((a, b) => a - b)
        .join(",")
    : "";

  useEffect(() => {
    setVariantes([]);
    if (!idsVariantes) return;
    let cancelado = false;
    getParfumsByIds(idsVariantes.split(",").map(Number)).then((filas) => {
      if (!cancelado) setVariantes(filas);
    });
    return () => {
      cancelado = true;
    };
  }, [idsVariantes]);

  useEffect(() => {
    // Al cambiar de perfume, limpia el error/estado del anterior.
    setError(null);
    setLoading(true);
    // Si cambia de perfume antes de que responda, ignora la respuesta vieja.
    let cancelado = false;
    async function fetchParfum() {
      try {
        const found = await getParfumById(id);
        if (cancelado) return;

        if (!found) {
          setError("Perfume no encontrado");
        } else {
          setParfum(found);
          registrarVisto(found);
        }
      } catch (err) {
        if (cancelado) return;
        console.error(err);
        setError("Error al cargar el perfume");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    fetchParfum();
    return () => {
      cancelado = true;
    };
  }, [id]);

  useEffect(() => {
    // Si entraste por una botella disponible, queda elegida; si no, eliges tú.
    setSeleccion(
      parfum?.stock === true && parfum?.disponible === "Disponible"
        ? { tipo: "botella", id: parfum.id }
        : null,
    );
    setBotellas(1);
    setYaAgrego(false);
  }, [parfum]);

  // Reseña del blog vinculada a este perfume (si existe).
  const [postResena, setPostResena] = useState(null);
  useEffect(() => {
    setPostResena(null);
    if (!parfum?.nombre) return;
    let cancelado = false;
    getPostDePerfume(parfum.nombre).then((post) => {
      if (!cancelado) setPostResena(post);
    });
    return () => {
      cancelado = true;
    };
  }, [parfum?.nombre]);

  // #7 — Muestra el botón flotante (escritorio) cuando el botón principal
  // de "Añadir al carrito" se sale de la vista al hacer scroll.
  useEffect(() => {
    const el = addBlockRef.current;
    if (!el) {
      setMostrarFloating(false);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => setMostrarFloating(!entry.isIntersecting),
      { rootMargin: "0px 0px -40% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [parfum]);

  // Oculta las barras flotantes al llegar al final del producto (para no tapar
  // el pie de página: Términos y Aviso de privacidad).
  useEffect(() => {
    const el = finRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setFinVisible(entry.isIntersecting),
      { rootMargin: "0px 0px 40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [parfum]);

  if (loading) return <LoadingSpinner />;

  if (error)
    return (
      <div className="text-center mt-20">
        <p className="text-red-500 font-semibold">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-md"
        >
          Volver
        </button>
      </div>
    );

  // Todas las versiones del perfume: la de esta página + las del otro formato.
  const filas = [parfum, ...variantes.filter((v) => v.id !== parfum.id)];
  const botellasFilas = filas
    .filter((f) => f.stock === true)
    .sort(
      (a, b) =>
        ordenDisponible(a) - ordenDisponible(b) ||
        (Number(a.mlBotella) || 0) - (Number(b.mlBotella) || 0),
    );
  const decantFila =
    filas.filter((f) => f.stock !== true).sort((a, b) => ordenDisponible(a) - ordenDisponible(b))[0] ||
    null;
  const decantDisponible = decantFila?.disponible === "Disponible";
  const opcionesMl = decantFila
    ? getOpcionesMililitros(decantFila, { minSiempre: minDecantSiempre, tienda: true })
    : [];

  const botellaSel =
    seleccion?.tipo === "botella"
      ? botellasFilas.find((b) => b.id === seleccion.id && b.disponible === "Disponible") || null
      : null;
  const esBotellaCompleta = Boolean(botellaSel);
  const esDecant = seleccion?.tipo === "decant" && decantDisponible;
  const mililitros = esDecant ? seleccion.ml : null;
  const activo = botellaSel || (esDecant ? decantFila : null);
  const estaDisponible = filas.some((f) => f.disponible === "Disponible");
  const puedeAgregar = Boolean(activo);

  // Estado del perfume en conjunto (para el badge): disponible si alguna
  // versión lo está.
  const estadoGrupo = estaDisponible
    ? "Disponible"
    : filas.some((f) => f.disponible === "Próximamente")
      ? "Próximamente"
      : parfum.disponible;

  // Precio "desde": la opción disponible más barata.
  const preciosDesde = [
    ...(decantDisponible && opcionesMl[0]
      ? [calcularPrecioDecant(decantFila, opcionesMl[0].value)]
      : []),
    ...botellasFilas
      .filter((b) => b.disponible === "Disponible")
      .map((b) => Number(b.precio) || 0),
  ].filter((n) => n > 0);
  const precioDesde = preciosDesde.length ? Math.min(...preciosDesde) : null;

  // Precio sin promoción, para mostrarlo tachado cuando hay promo (p. ej. LV 30 ml).
  const precioAntesPromo =
    esDecant && precioPromo(decantFila.casa, decantFila.precio, mililitros) != null
      ? (Number(decantFila.precio) || 0) * mililitros
      : null;
  const tachado = precioAntesPromo ? (
    <span className="ml-1 text-gray-400 line-through font-normal">${formatPrecio(precioAntesPromo)}</span>
  ) : null;

  const totalPrice = esBotellaCompleta
    ? botellaSel.precio * botellas
    : esDecant
      ? calcularPrecioDecant(decantFila, mililitros)
      : 0;

  const handleAddToCart = () => {
    if (!activo) return;

    const product = {
      id: activo.id,
      nombre: activo.nombre,
      image: activo.image,
      casa: activo.casa,
      tipoVenta: esBotellaCompleta ? "botella" : "decant",
      precioUnitario: activo.precio,
      mlBotella: esBotellaCompleta ? activo.mlBotella : null,
      mililitros: esDecant ? mililitros : null,
      cantidad: esBotellaCompleta ? botellas : null,
      estado_botella: esBotellaCompleta ? activo.estado_botella || null : null,
    };

    addToCart(product);
    track("add_to_cart", {
      producto: activo.nombre,
      tipo: esBotellaCompleta ? "botella" : "decant",
      total: totalPrice,
    });
    setAdded(true);
    setYaAgrego(true);
    // Limpia la selección para que la siguiente compra empiece de cero.
    setSeleccion(null);
    setBotellas(1);
    setTimeout(() => setAdded(false), 2000);
  };

  // Texto SEO específico del producto
  const seoTitle = tituloSeoProducto(parfum);
  const seoDescription = metaDescripcionProducto(parfum);
  const parrafos = parrafosDescripcion(parfum.descripcion);
  const seoImage = parfum.image;
  const seoUrl = `https://perfumesdediego.com/product/${slugify(parfum.nombre)}/${parfum.id}`;

  // Schema.org Product: Google muestra precio y disponibilidad en resultados
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: parfum.nombre,
    description: parfum.descripcion?.trim() || seoDescription,
    image: parfum.image,
    brand: parfum.casa
      ? { "@type": "Brand", name: parfum.casa }
      : undefined,
    offers: {
      "@type": "Offer",
      url: seoUrl,
      priceCurrency: "MXN",
      price: parfum.precio,
      availability:
        parfum.disponible === "Disponible"
          ? "https://schema.org/InStock"
          : parfum.disponible === "Próximamente"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={seoUrl}
        type="product"
        schema={productSchema}
        sinMarca
      />
      <div className="flex flex-col lg:flex-row gap-10 bg-white p-4 sm:p-6 rounded-2xl shadow-md max-w-6xl mx-auto my-3 sm:my-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          {/* IMAGEN — en celular la flecha va encima de la foto y la foto es
              más baja, para que nombre y precio se vean sin bajar. */}
          <div className="relative">
            <button
              onClick={() => {
                navigate(-1);
              }}
              aria-label="Regresar"
              className="absolute top-0 left-0 z-10 rounded-full bg-white/80 p-1 text-gray-600 hover:text-gray-900 sm:static sm:bg-transparent sm:p-0 sm:mb-4 flex"
            >
              <ArrowLeft size={24} />
            </button>

            <img
              src={imgOriginal ? parfum.image : imagenThumb(parfum.image, 900)}
              alt={parfum.nombre}
              loading="eager"
              onError={() => setImgOriginal(true)}
              className="max-h-52 sm:max-h-full mx-auto rounded-xl object-contain"
            />
          </div>

          {/* INFORMACIÓN */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <BadgesEstatus parfum={{ ...parfum, disponible: estadoGrupo }} />
              <h1 className="text-2xl font-semibold mb-2">{parfum.nombre}</h1>

              <p className="text-gray-500 text-sm italic">
                {parfum.concentracion}
              </p>

              <p className="text-gray-500 text-sm font-semibold mb-1">
                {parfum.casa}
              </p>

              {parfum.casa && (
                <button
                  type="button"
                  onClick={() => navigate(`/casa/${slugify(parfum.casa)}`)}
                  className="text-xs text-[#A47E3B] hover:text-[#D4AF7A] font-semibold mb-3 inline-flex items-center gap-1 hover:underline"
                >
                  Ver todos los {parfum.casa} →
                </button>
              )}

              {/* PRECIO: el de la opción elegida o "desde" */}
              <div className="flex items-baseline gap-2 my-5 flex-wrap">
                {activo ? (
                  <>
                    <span className="text-3xl font-bold text-gray-900">
                      ${formatPrecio(totalPrice)}
                    </span>
                    {tachado}
                    {esDecant && (
                      <span className="text-sm text-gray-500">por {mililitros} ml</span>
                    )}
                  </>
                ) : precioDesde != null ? (
                  <span className="text-3xl font-bold text-gray-900">
                    <span className="text-lg font-semibold text-gray-500">Desde </span>$
                    {formatPrecio(precioDesde)}
                  </span>
                ) : null}
              </div>

              {/* BOTELLA COMPLETA */}
              {botellasFilas.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
                    Botella completa
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {botellasFilas.map((b) => {
                      const disponible = b.disponible === "Disponible";
                      const extra = [
                        b.linea_tester,
                        b.estado_botella,
                        b.tiene_caja == null ? null : b.tiene_caja ? "Con caja" : "Sin caja",
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <Opcion
                          key={b.id}
                          titulo={`${b.nombre}${b.mlBotella ? ` ${b.mlBotella} ml` : ""}`}
                          detalle={
                            disponible
                              ? `$${formatPrecio(b.precio)}${extra ? ` · ${extra}` : ""}`
                              : b.disponible || "Agotado"
                          }
                          activa={botellaSel?.id === b.id}
                          disabled={!disponible}
                          onClick={() => {
                            setSeleccion({ tipo: "botella", id: b.id });
                            setBotellas(1);
                          }}
                        />
                      );
                    })}
                  </div>
                  {esBotellaCompleta && (
                    <div className="mt-3 max-w-xs">
                      <CustomSelect
                        label="Piezas"
                        value={botellas}
                        onChange={(val) => setBotellas(val)}
                        options={Array.from({ length: MAX_BOTELLAS }, (_, i) => i + 1).map((num) => ({
                          value: num,
                          label: `${num} pieza${num > 1 ? "s" : ""}`,
                        }))}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Sin botella en la tienda: se cotiza por WhatsApp */}
              {botellasFilas.length === 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
                    Botella completa
                  </p>
                  <a
                    href={`https://wa.me/5212212034647?text=${encodeURIComponent(
                      `Hola Diego, me interesa la botella completa de ${parfum.nombre}${
                        parfum.casa ? ` de ${parfum.casa}` : ""
                      }. ¿Me la puedes cotizar?`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("cotizar_botella", { producto: parfum.nombre })}
                    className="inline-block rounded-xl border border-gray-300 bg-white px-4 py-2 text-left text-gray-800 transition-colors hover:border-[#A47E3B]"
                  >
                    <span className="block text-sm font-semibold">{parfum.nombre}</span>
                    <span className="block text-xs text-[#A47E3B] font-semibold">
                      Solicita cotización →
                    </span>
                  </a>
                </div>
              )}

              {/* DECANTS */}
              {decantFila && (
                <div className="mb-2">
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
                    Decants
                    <span className="normal-case tracking-normal font-normal">
                      {" - "}
                      {decantDisponible
                        ? `$${formatPrecio(decantFila.precio)}/ml`
                        : (decantFila.disponible || "Agotado").toLowerCase()}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {opcionesMl.map((o) => {
                      const promo = precioPromo(decantFila.casa, decantFila.precio, o.value) != null;
                      return (
                        <Opcion
                          key={o.value}
                          titulo={`${o.value} ml`}
                          detalle={
                            decantDisponible
                              ? `$${formatPrecio(calcularPrecioDecant(decantFila, o.value))}${promo ? " · Promo" : ""}`
                              : null
                          }
                          activa={esDecant && mililitros === o.value}
                          disabled={!decantDisponible}
                          onClick={() => setSeleccion({ tipo: "decant", ml: o.value })}
                        />
                      );
                    })}
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-[#A47E3B] hover:underline">
                      ¿Qué es un decant?
                    </summary>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                      Un decant es una porción del perfume original, traspasada a
                      un atomizador más pequeño. Así pruebas el mismo perfume
                      desde 1 ml, sin pagar la botella completa.
                    </p>
                  </details>
                </div>
              )}

              {/* BOTÓN añadir — abajo del selector (escritorio) */}
              {estaDisponible && (
                <div
                  ref={addBlockRef}
                  className="mt-4 hidden sm:flex sm:flex-col gap-2 items-start"
                >
                  {!activo && (
                    <p className="text-sm text-gray-500">Elige una opción para agregar</p>
                  )}
                  <button
                    onClick={handleAddToCart}
                    disabled={added || !puedeAgregar}
                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-300 w-full sm:w-auto ${
                      added
                        ? "bg-green-500 text-white cursor-default"
                        : puedeAgregar
                          ? "bg-[#A47E3B] text-white hover:bg-[#D4AF7A] active:bg-[#8B6A30]"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {added ? (
                      <>
                        <CheckCircle size={18} />
                        Agregado al carrito
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        Añadir al carrito
                      </>
                    )}
                  </button>

                  {yaAgrego && (
                    <button
                      onClick={openCart}
                      className="text-sm font-semibold text-[#A47E3B] hover:text-[#D4AF7A] hover:underline"
                    >
                      Ver carrito →
                    </button>
                  )}
                </div>
              )}

              {/* FORMULARIO AVÍSAME (si no está Disponible) */}
              {!estaDisponible && (
                <div className="mt-4">
                  <AvisameFormulario parfum={parfum} />
                </div>
              )}

              {/* DETALLES */}
              <div className="my-6">
                <h2 className="text-sm font-semibold text-gray-700 mt-2">
                  NOTAS:
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(parfum.notas || "")
                    .split(",")
                    .map((n) => n.trim())
                    .filter(Boolean)
                    .map((nota, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
                      >
                        {formatNota(nota)}
                      </span>
                    ))}
                </div>

                {parfum.fraganticaLink && (
                  <a
                    href={parfum.fraganticaLink}
                    className="text-sm text-[#D4AF7A] hover:underline mt-4 inline-block"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Conocer más sobre "{parfum.nombre}" en Fragrantica
                  </a>
                )}

                {postResena && (
                  <Link
                    to={`/blog/${postResena.slug}`}
                    className="block mt-2 text-xs text-gray-500 hover:text-[#A47E3B] hover:underline"
                  >
                    Reseña completa en el blog →
                  </Link>
                )}

                {/* Reseña en desplegable: cerrada por defecto, pero el texto
                    sigue en la página, así que Google lo lee igual. */}
                {parrafos.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-[#A47E3B] hover:underline">
                      Ver descripción del perfume
                    </summary>
                    <div className="text-sm text-gray-700 leading-6 space-y-3 mt-2">
                      {parrafos.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              <BadgesConfianza />
            </div>
          </div>
        </div>
      </div>

      <PerfumesRelacionados casa={parfum.casa} excluirId={parfum.id} actual={parfum} />

      <RecentlyViewed excluirId={parfum.id} />

      <TestimoniosSeccion />

      <CTAWhatsApp
        titulo={`¿Tienes dudas sobre ${parfum.nombre}?`}
        mensaje="Cuéntame qué notas buscas o si necesitas comparar con otro perfume. Te respondo personalmente."
        whatsappText={`Hola Diego, me interesa saber más sobre ${parfum.nombre} de ${parfum.casa}`}
      />

      {/* Sentinela: marca el final del producto para ocultar las barras
          flotantes y no tapar el pie de página. */}
      <div ref={finRef} aria-hidden="true" className="h-px w-full" />

      {/* Sticky CTA solo en mobile cuando el perfume está disponible */}
      {estaDisponible && !finVisible && (
        <>
          {/* Spacer para que el sticky no tape el contenido */}
          <div className="sm:hidden h-20" aria-hidden="true" />

          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] p-3">
            <div className="flex flex-col gap-1.5">
              {!activo ? (
                <p className="text-center text-sm font-semibold text-gray-600">
                  Elige botella o mililitros 👆 para agregar
                </p>
              ) : (
                <div className="text-[#A47E3B] text-sm font-semibold text-center">
                  Total: ${formatPrecio(totalPrice)}
                  {tachado}
                  {esDecant ? ` por ${mililitros} ml` : ""}
                </div>
              )}
              <button
                onClick={handleAddToCart}
                disabled={added || !puedeAgregar}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  added
                    ? "bg-green-500 text-white cursor-default"
                    : puedeAgregar
                      ? "bg-[#A47E3B] text-white active:bg-[#8B6A30]"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {added ? (
                  <>
                    <CheckCircle size={18} />
                    Agregado al carrito
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Añadir al carrito
                  </>
                )}
              </button>

              {yaAgrego && (
                <button
                  onClick={openCart}
                  className="text-sm font-semibold text-[#A47E3B] text-center py-1"
                >
                  Ver carrito →
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* #7 — Botón flotante en escritorio cuando el principal se va de vista */}
      {estaDisponible && mostrarFloating && !finVisible && (
        <div className="hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-30 items-center gap-4 bg-white border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.18)] rounded-full pl-6 pr-2 py-2">
          <div className="text-sm font-semibold text-gray-800 whitespace-nowrap">
            {!activo ? (
              <span className="text-gray-600">Elige una opción</span>
            ) : (
              <>
                Total:{" "}
                <span className="text-[#A47E3B]">
                  ${formatPrecio(totalPrice)}
                  {tachado}
                </span>
                {esDecant ? ` / ${mililitros} ml` : ""}
              </>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={added || !puedeAgregar}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              added
                ? "bg-green-500 text-white cursor-default"
                : puedeAgregar
                  ? "bg-[#A47E3B] text-white hover:bg-[#D4AF7A]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {added ? (
              <>
                <CheckCircle size={16} />
                Agregado
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                Añadir
              </>
            )}
          </button>
        </div>
      )}

      </>
  );
}