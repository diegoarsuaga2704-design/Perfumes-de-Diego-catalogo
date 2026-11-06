import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import SEO from "../ui/SEO";
import { formatPrecio } from "../functions/formatPrecio";
import { useCart } from "../context/CartContext";
import { useParfums } from "../context/ParfumsContext";
import {
  consultarPedidoWeb,
  leerMisPedidos,
  ESTADOS_PEDIDO,
} from "../functions/pedidosWeb";

const $ = (n) => `$${formatPrecio(n)}`;
const fecha = (iso) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

const lineaTexto = (it) =>
  it.tipoVenta === "botella"
    ? `${it.nombre}${it.mlBotella ? ` ${it.mlBotella} ml` : ""} · ${it.cantidad} pieza${it.cantidad > 1 ? "s" : ""}`
    : `${it.nombre} · ${it.mililitros} ml`;

// Consulta de un pedido con su número (viene en el mensaje de WhatsApp).
export default function MiPedido() {
  const [params, setParams] = useSearchParams();
  const [numero, setNumero] = useState(params.get("n") || "");
  const [pedido, setPedido] = useState(null);
  const [estado, setEstado] = useState("inicio"); // inicio | cargando | listo | no_existe | error
  const [repetido, setRepetido] = useState("");
  const misPedidos = leerMisPedidos();
  const { addToCart, openCart } = useCart();
  const { parfums = [] } = useParfums() || {};

  const buscar = async (n) => {
    const limpio = (n || "").trim().toUpperCase().replace(/^#/, "");
    if (!limpio) return;
    setEstado("cargando");
    setRepetido("");
    setParams({ n: limpio }, { replace: true });
    try {
      const p = await consultarPedidoWeb(limpio);
      setPedido(p);
      setEstado(p ? "listo" : "no_existe");
    } catch {
      setEstado("error");
    }
  };

  useEffect(() => {
    if (params.get("n")) buscar(params.get("n"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vuelve a poner el pedido en el carrito con los precios de hoy. Lo que ya
  // no está disponible se avisa y no se agrega.
  const repetir = () => {
    const faltan = [];
    for (const it of pedido.items || []) {
      const actual = parfums.find((p) => p.id === it.id);
      if (!actual || actual.disponible !== "Disponible") {
        faltan.push(it.nombre);
        continue;
      }
      addToCart({
        id: actual.id,
        nombre: actual.nombre,
        image: actual.image,
        casa: actual.casa,
        tipoVenta: it.tipoVenta,
        precioUnitario: actual.precio,
        mlBotella: it.tipoVenta === "botella" ? it.mlBotella : null,
        mililitros: it.tipoVenta === "decant" ? it.mililitros : null,
        cantidad: it.tipoVenta === "botella" ? it.cantidad : null,
        estado_botella: it.estado_botella || null,
      });
    }
    setRepetido(
      faltan.length
        ? `Agregué lo disponible a tu carrito. No están disponibles hoy: ${faltan.join(", ")}.`
        : "Listo, tu pedido está en el carrito con los precios de hoy.",
    );
    if (faltan.length < (pedido.items || []).length) openCart?.();
  };

  const infoEstado = pedido ? ESTADOS_PEDIDO[pedido.estado] : null;

  return (
    <section className="bg-gray-100 min-h-screen py-8 px-4">
      <SEO title="Mi pedido" description="Consulta tu pedido de Perfumes de Diego con su número." />
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Mi pedido</h1>
        <p className="text-sm text-gray-600">
          Escribe el número que viene en tu mensaje de WhatsApp (por ejemplo PD-7K2Q9M).
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            buscar(numero);
          }}
          className="flex gap-2"
        >
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value.toUpperCase())}
            placeholder="PD-XXXXXX"
            autoCapitalize="characters"
            className="flex-1 border border-gray-300 rounded-md px-3 py-3 text-base bg-white focus:ring-2 focus:ring-[#A47E3B] focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 bg-[#A47E3B] text-white px-4 rounded-md font-semibold hover:bg-[#8b6d32]"
          >
            <Search size={18} /> Buscar
          </button>
        </form>

        {misPedidos.length > 0 && (
          <div className="text-sm text-gray-600">
            <p className="mb-1">Pedidos hechos desde este celular:</p>
            <div className="flex flex-wrap gap-2">
              {misPedidos.map((p) => (
                <button
                  key={p.numero}
                  type="button"
                  onClick={() => {
                    setNumero(p.numero);
                    buscar(p.numero);
                  }}
                  className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:border-[#A47E3B]"
                >
                  {p.numero} · {fecha(p.fecha)}
                </button>
              ))}
            </div>
          </div>
        )}

        {estado === "cargando" && <p className="text-sm text-gray-500">Buscando…</p>}
        {estado === "no_existe" && (
          <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-4">
            No encontré un pedido con ese número. Revisa que esté bien escrito o escríbeme por
            WhatsApp al <span className="font-semibold whitespace-nowrap">+52 221 203 4647</span>.
          </p>
        )}
        {estado === "error" && (
          <p className="text-sm text-red-600">No se pudo consultar ahora. Intenta de nuevo en un momento.</p>
        )}

        {estado === "listo" && pedido && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-gray-900 text-lg">#{pedido.numero}</p>
                <p className="text-sm text-gray-500">{fecha(pedido.created_at)}</p>
              </div>
              {infoEstado && (
                <span className={`text-xs font-semibold px-2 py-1 rounded ${infoEstado.color}`}>
                  {infoEstado.cliente}
                </span>
              )}
            </div>

            <ul className="divide-y divide-gray-100 text-sm">
              {(pedido.items || []).map((it, i) => (
                <li key={i} className="py-2 flex justify-between gap-3">
                  <span className="text-gray-800">
                    {lineaTexto(it)}
                    {it.casa ? <span className="text-gray-500"> · {it.casa}</span> : null}
                  </span>
                  <span className="text-gray-900 whitespace-nowrap">{$(it.subtotal)}</span>
                </li>
              ))}
            </ul>

            <div className="text-sm space-y-1 border-t pt-3">
              <div className="flex justify-between text-gray-700">
                <span>Productos</span>
                <span>{$(pedido.subtotal)}</span>
              </div>
              {Number(pedido.descuento) > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Descuento{pedido.codigo_descuento ? ` (${pedido.codigo_descuento})` : ""}</span>
                  <span>−{$(pedido.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700">
                <span>Envío</span>
                <span>{Number(pedido.envio) > 0 ? $(pedido.envio) : "Gratis"}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
                <span>Total</span>
                <span>{$(pedido.total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={repetir}
                className="py-3 rounded-md bg-[#A47E3B] text-white font-semibold hover:bg-[#8b6d32]"
              >
                Volver a pedirlo
              </button>
              <a
                href={`https://wa.me/5212212034647?text=${encodeURIComponent(
                  `Hola Diego, te escribo sobre mi pedido #${pedido.numero}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 rounded-md border border-[#A47E3B] text-[#A47E3B] font-semibold text-center hover:bg-[#A47E3B]/10"
              >
                Escribirme por este pedido
              </a>
            </div>
            {repetido && <p className="text-sm text-gray-700">{repetido}</p>}
          </div>
        )}

        <p className="text-xs text-gray-500">
          ¿Dudas? Revisa las{" "}
          <Link to="/faqs" className="underline">
            preguntas frecuentes
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
