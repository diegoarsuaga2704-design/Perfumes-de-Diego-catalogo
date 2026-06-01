import { useParams, useNavigate } from "react-router-dom";
import { slugify } from "../functions/slugify";
import { useEffect, useState } from "react";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { getParfumById } from "../functions/getParfums";
import { calcularPrecioDecant } from "../functions/pricingDecant";
import LoadingSpinner from "../ui/LoadingSpinner";
import SelectMililitros from "../ui/SelectMililitros";
import CTAWhatsApp from "../ui/CTAWhatsApp";
import BadgesConfianza from "../ui/BadgesConfianza";
import BadgesEstatus from "../ui/BadgesEstatus";
import AvisameFormulario from "../ui/AvisameFormulario";
import PerfumesRelacionados from "../ui/PerfumesRelacionados";
import TestimoniosSeccion from "../ui/TestimoniosSeccion";
import { useCart } from "../context/CartContext";
import CustomSelect from "../ui/CustomSelect";
import SEO from "../ui/SEO";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parfum, setParfum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mililitros, setMililitros] = useState(null);
  const [botellas, setBotellas] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchParfum() {
      try {
        const found = await getParfumById(id);

        if (!found) {
          setError("Perfume no encontrado");
        } else {
          setParfum(found);
        }
      } catch (err) {
        console.error(err);
        setError("Error al cargar el perfume");
      } finally {
        setLoading(false);
      }
    }

    fetchParfum();
  }, [id]);

  useEffect(() => {
    setMililitros(null);
    setBotellas(1);
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

  const esBotellaCompleta = parfum.stock === true;
  const esDecant = parfum.stock === false;
  const estaDisponible = parfum.disponible === "Disponible";

  const totalPrice = esBotellaCompleta
    ? parfum.precio * botellas
    : calcularPrecioDecant(parfum, mililitros);

  const handleAddToCart = () => {
    if (!estaDisponible) return;
    if (esDecant && !mililitros) return;
    if (esBotellaCompleta && (!parfum.botellasDisponibles || parfum.botellasDisponibles < 1)) return;

    const product = {
      id: parfum.id,
      nombre: parfum.nombre,
      image: parfum.image,
      casa: parfum.casa,
      tipoVenta: esBotellaCompleta ? "botella" : "decant",
      precioUnitario: parfum.precio,
      precio30ml: parfum.precio30ml || null,
      mlBotella: esBotellaCompleta ? parfum.mlBotella : null,
      mililitros: esDecant ? mililitros : null,
      cantidad: esBotellaCompleta ? botellas : null,
      stockDisponible: esBotellaCompleta ? parfum.botellasDisponibles : null,
      estado_botella: parfum.estado_botella || null,
    };

    addToCart(product);
  };

  // Texto SEO específico del producto
  const seoTitle = `${parfum.nombre}${parfum.casa ? ` de ${parfum.casa}` : ""}`;
  const seoDescription = parfum.notas
    ? `${parfum.nombre} (${parfum.concentracion || "Eau de Parfum"})${parfum.casa ? ` de ${parfum.casa}` : ""}. Notas: ${parfum.notas}. Disponible en decant o botella.`
    : `${parfum.nombre}${parfum.casa ? ` de ${parfum.casa}` : ""}. Disponible para comprar en decant o botella.`;
  const seoImage = parfum.image;
  const seoUrl = `https://perfumes-de-diego-catalogo.vercel.app/product/${parfum.id}`;

  // Schema.org Product: Google muestra precio y disponibilidad en resultados
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: parfum.nombre,
    description: seoDescription,
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
      />
      <div className="flex flex-col lg:flex-row gap-10 bg-white p-6 rounded-2xl shadow-md max-w-6xl mx-auto my-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* IMAGEN */}
          <div>
            <button
              onClick={() => {
                navigate(-1);
              }}
              className="text-sm text-gray-600 mb-4 hover:text-gray-900 flex"
            >
              <ArrowLeft size={24} />
            </button>

            <img
              src={parfum.image}
              alt={parfum.nombre}
              loading="eager"
              className="max-h-60 sm:max-h-full mx-auto rounded-xl object-contain"
            />
          </div>

          {/* INFORMACIÓN */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <BadgesEstatus parfum={parfum} />
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-2xl font-semibold">{parfum.nombre}</h1>
                {parfum.linea_tester && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-semibold">
                    {parfum.linea_tester}
                  </span>
                )}
              </div>

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

              {/* PRECIO */}
              <div className="flex items-center gap-4 my-5 flex-wrap">
                {esBotellaCompleta && (
                  <>
                    <span className="text-3xl font-bold text-gray-900">
                      ${parfum.precio}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                      Botella completa
                    </span>
                  </>
                )}

                {esDecant && (
                  <>
                    <span className="text-3xl font-bold text-gray-900">
                      ${parfum.precio}
                      <span className="text-lg">/ml</span>
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold">
                      Decant
                    </span>
                  </>
                )}
              </div>

              {/* Aviso de precio especial 30 ml para Louis Vuitton */}
              {esDecant &&
                parfum.casa === "Louis Vuitton" &&
                parfum.precio30ml && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4 inline-block">
                    Precio especial para 30 ml:{" "}
                    <span className="font-bold">${parfum.precio30ml}</span>
                  </p>
                )}

              {/* SELECTOR PARA BOTELLAS */}
              {esBotellaCompleta && estaDisponible && (
                <div className="flex flex-col gap-1">
                  <CustomSelect
                    label="Selecciona cantidad de piezas"
                    value={botellas}
                    onChange={(val) => setBotellas(val)}
                    options={Array.from(
                      { length: parfum.botellasDisponibles },
                      (_, i) => i + 1,
                    ).map((num) => ({
                      value: num,
                      label: `${num} pieza${num > 1 ? "s" : ""}`,
                    }))}
                  />

                  <div className="text-[#D4AF7A] mt-4 font-semibold">
                    Total: ${totalPrice} por {botellas} pieza
                    {botellas > 1 ? "s" : ""}
                  </div>
                </div>
              )}

              {/* DETALLES */}
              <div className="my-6">
                {parfum.mlBotella && (
                  <>
                    <h2 className="text-sm font-semibold text-gray-700 mt-2">
                      TAMAÑO:
                    </h2>
                    <ul className="text-sm text-gray-600 leading-6">
                      <li>{parfum.mlBotella} ml</li>
                    </ul>
                  </>
                )}

                {parfum.estado_botella && (
                  <>
                    <h2 className="text-sm font-semibold text-gray-700 mt-2">
                      ESTADO:
                    </h2>
                    <ul className="text-sm text-gray-600 leading-6">
                      <li>{parfum.estado_botella}</li>
                    </ul>
                  </>
                )}

                {parfum.tiene_caja !== null && parfum.tiene_caja !== undefined && (
                  <>
                    <h2 className="text-sm font-semibold text-gray-700 mt-2">
                      CAJA:
                    </h2>
                    <ul className="text-sm text-gray-600 leading-6">
                      <li>{parfum.tiene_caja ? "Con caja" : "Sin caja"}</li>
                    </ul>
                  </>
                )}

                <h2 className="text-sm font-semibold text-gray-700 mt-2">
                  NOTAS:
                </h2>
                <ul className="text-sm text-gray-600 leading-6">
                  <li>{parfum.notas}</li>
                </ul>

                <h2 className="text-sm font-semibold text-gray-700 mt-2">
                  CATEGORÍA:
                </h2>
                <ul className="text-sm text-gray-600 leading-6">
                  <li>{parfum.categoria}</li>
                </ul>

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
              </div>

              {/* SELECTOR SOLO PARA DECANTS */}
              {esDecant && estaDisponible && (
                <>
                  <SelectMililitros
                    value={mililitros}
                    onChange={setMililitros}
                    parfum={parfum}
                  />

                  {mililitros && (
                    <div className="text-[#D4AF7A] mt-4 font-semibold">
                      Total: ${totalPrice} por {mililitros} ml
                    </div>
                  )}
                </>
              )}

              {/* FORMULARIO AVÍSAME (si no está Disponible) o BOTÓN añadir */}
              {!estaDisponible ? (
                <div className="mt-4">
                  <AvisameFormulario parfum={parfum} />
                </div>
              ) : (
                <div className="mt-4 flex gap-3 items-center">
                  <button
                    onClick={handleAddToCart}
                    disabled={
                      (esDecant && !mililitros) ||
                      (esBotellaCompleta && (!parfum.botellasDisponibles || parfum.botellasDisponibles < 1))
                    }
                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-300 w-full sm:w-auto ${
                      (!esDecant || mililitros) &&
                      (!esBotellaCompleta || (parfum.botellasDisponibles && parfum.botellasDisponibles >= 1))
                        ? "bg-[#A47E3B] text-white hover:bg-[#D4AF7A] active:bg-[#8B6A30]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart size={18} />
                    Añadir al carrito
                  </button>
                </div>
              )}

              <BadgesConfianza />
            </div>
          </div>
        </div>
      </div>

      <PerfumesRelacionados casa={parfum.casa} excluirId={parfum.id} />

      <TestimoniosSeccion />

      <CTAWhatsApp
        titulo={`¿Tienes dudas sobre ${parfum.nombre}?`}
        mensaje="Cuéntame qué notas buscas o si necesitas comparar con otro perfume. Te respondo personalmente."
        whatsappText={`Hola Diego, me interesa saber más sobre ${parfum.nombre} de ${parfum.casa}`}
      />

      {/* Sticky CTA solo en mobile cuando el perfume está disponible */}
      {estaDisponible && (
        <>
          {/* Spacer para que el sticky no tape el contenido */}
          <div className="sm:hidden h-20" aria-hidden="true" />

          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg p-3">
            <button
              onClick={handleAddToCart}
              disabled={
                (esDecant && !mililitros) ||
                (esBotellaCompleta && (!parfum.botellasDisponibles || parfum.botellasDisponibles < 1))
              }
              className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                (!esDecant || mililitros) &&
                (!esBotellaCompleta || (parfum.botellasDisponibles && parfum.botellasDisponibles >= 1))
                  ? "bg-[#A47E3B] text-white active:bg-[#8B6A30]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <ShoppingCart size={18} />
              {esDecant && !mililitros
                ? "Selecciona los ml primero"
                : "Añadir al carrito"}
            </button>
          </div>
        </>
      )}

      </>
  );
}
