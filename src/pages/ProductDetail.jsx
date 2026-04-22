import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShoppingCart, ArrowLeft, CheckCircle } from "lucide-react";
import { getParfumById } from "../functions/getParfums";
import LoadingSpinner from "../ui/LoadingSpinner";
import SelectMililitros from "../ui/SelectMililitros";
import CTAWhatsApp from "../ui/CTAWhatsApp";
import BadgesConfianza from "../ui/BadgesConfianza";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parfum, setParfum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mililitros, setMililitros] = useState(null);
  const [botellas, setBotellas] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
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

  /* Reinicia mililitros cuando cambia el producto */
  // useEffect(() => {
  //   if (parfum?.stock === true) {
  //     setMililitros(1);
  //   }
  // }, [parfum]);
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

  /* ===========================
     LÓGICA DE TIPO DE VENTA
  ============================ */

  const esBotellaCompleta = parfum.stock === true;
  const esDecant = parfum.stock === false;
  const estaDisponible = parfum.disponible === "Disponible";

  // const totalPrice = esBotellaCompleta
  //   ? parfum.precio
  //   : mililitros === 30 && parfum.casa === "Louis Vuitton"
  //     ? parfum?.precio30ml
  //     : parfum.precio * mililitros;
  const totalPrice = esBotellaCompleta
    ? parfum.precio * botellas
    : mililitros == null
      ? 0
      : mililitros === 30 && parfum.casa === "Louis Vuitton"
        ? parfum?.precio30ml
        : parfum.precio * mililitros;

  const handleAddToCart = () => {
    if (!estaDisponible) return;
    if (esDecant && !mililitros) return;

    const product = {
      id: parfum.id,
      nombre: parfum.nombre,
      image: parfum.image,
      casa: parfum.casa,
      tipoVenta: esBotellaCompleta ? "botella" : "decant",
      precioUnitario: parfum.precio,
      mlBotella: esBotellaCompleta ? parfum.mlBotella : null,
      mililitros: esDecant ? mililitros : null,
      cantidad: esBotellaCompleta ? botellas : null,
      stockDisponible: esBotellaCompleta
        ? parfum.botellasDisponibles
        : parfum.stockMililitros,
    };

    addToCart(product);

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-10 bg-white p-6 rounded-2xl shadow-md max-w-6xl mx-auto my-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* IMAGEN */}
          <div>
            <button
              onClick={() => {
                navigate(-1);
                setMililitros(1);
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
              <h1 className="text-2xl font-semibold mb-2">{parfum.nombre}</h1>

              <p className="text-gray-500 text-sm italic">
                {parfum.concentracion}
              </p>

              <p className="text-gray-500 text-sm font-semibold mb-3">
                {parfum.casa}
              </p>

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
              {/* SELECTOR PARA BOTELLAS */}
              {esBotellaCompleta && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Selecciona cantidad de piezas
                  </label>

                  <select
                    value={botellas}
                    onChange={(e) => setBotellas(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-gray-800 bg-white shadow-sm focus:ring-2 focus:ring-[#A47E3B] focus:border-[#A47E3B]"
                  >
                    {Array.from(
                      { length: parfum.botellasDisponibles },
                      (_, i) => i + 1,
                    ).map((num) => (
                      <option key={num} value={num}>
                        {num} pieza{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>

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
              {esDecant && (
                <>
                  <SelectMililitros
                    value={mililitros}
                    onChange={setMililitros}
                  />

                  {mililitros && (
                    <div className="text-[#D4AF7A] mt-4 font-semibold">
                      Total: ${totalPrice} por {mililitros}ml
                    </div>
                  )}
                </>
              )}

              {/* BOTÓN */}
              <BadgesConfianza />

              <div className="mt-4 flex gap-4 items-center">

                <button
                  onClick={handleAddToCart}
                  disabled={!estaDisponible || (esDecant && !mililitros)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm transition-all duration-300 ${
                    estaDisponible && (!esDecant || mililitros)
                      ? "bg-[#A47E3B] text-white hover:bg-[#D4AF7A]"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <ShoppingCart size={18} />
                  Añadir al carrito
                </button>

                {showSuccess && (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium animate-fade-in">
                    <CheckCircle size={16} />
                    Agregado con éxito
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CTAWhatsApp
        titulo={`¿Tienes dudas sobre ${parfum.nombre}?`}
        mensaje="Cuéntame qué notas buscas o si necesitas comparar con otro perfume. Te respondo personalmente."
        whatsappText={`Hola Diego, me interesa saber más sobre ${parfum.nombre} de ${parfum.casa}`}
      />

      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-in-out;
          }
        `}
      </style>
    </>
  );
}
