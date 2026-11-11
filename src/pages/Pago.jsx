import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { track } from "@vercel/analytics";
import SEO from "../ui/SEO";
import { useCart } from "../context/CartContext";
import { olvidarNumeroActual } from "../functions/pedidosWeb";
import { borrarCupon } from "../functions/cuponBienvenida";

const WHATSAPP = "5212212034647";

// Regreso de Mercado Pago. El estado real del pago lo confirma el servidor
// (api/mp-webhook); aquí solo se le dice al cliente qué pasó.
export default function Pago() {
  const [params] = useSearchParams();
  const { vaciarCarrito = () => {} } = useCart() || {};
  const numero = (params.get("n") || params.get("external_reference") || "").toUpperCase();
  const status = params.get("collection_status") || params.get("status") || "";
  const idPago = params.get("payment_id") || params.get("collection_id") || "";
  const r = params.get("r");

  const resultado =
    status === "approved" || (r === "ok" && !status)
      ? "ok"
      : ["pending", "in_process", "authorized"].includes(status) || r === "pendiente"
        ? "pendiente"
        : "error";

  const hecho = useRef(false);
  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    window.scrollTo(0, 0);
    track("pago_linea_regreso", { resultado });
    // Pide al servidor que revise el pago con Mercado Pago (por si el aviso
    // automático tarda o no llega).
    if (/^\d+$/.test(idPago)) {
      fetch(`/api/mp-webhook?type=payment&data.id=${idPago}`).catch(() => {});
    }
    if (resultado !== "error") {
      vaciarCarrito();
      olvidarNumeroActual();
      borrarCupon();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const linkWhatsApp = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    resultado === "ok"
      ? `Hola Diego, ya pagué mi pedido #${numero} en la página.`
      : `Hola Diego, tengo una duda con el pago de mi pedido #${numero}.`,
  )}`;

  const contenido = {
    ok: {
      icono: <CheckCircle size={44} className="text-green-600" />,
      titulo: "¡Gracias! Recibí tu pago",
      texto:
        "Tu pedido ya está registrado. Te escribo por WhatsApp para confirmarte el envío y pasarte tu guía de DHL.",
    },
    pendiente: {
      icono: <Clock size={44} className="text-amber-600" />,
      titulo: "Tu pago está pendiente",
      texto:
        "Si elegiste OXXO o transferencia, paga con la referencia que te dio Mercado Pago. En cuanto se acredite, preparo tu pedido y te escribo por WhatsApp.",
    },
    error: {
      icono: <XCircle size={44} className="text-red-600" />,
      titulo: "No se completó el pago",
      texto:
        "No se hizo ningún cargo. Tu carrito sigue guardado: puedes intentar otra vez o pedirlo por WhatsApp.",
    },
  }[resultado];

  return (
    <section className="bg-gray-100 min-h-[70vh] py-10 px-4">
      <SEO title="Pago" description="Estado de tu pago en Perfumes de Diego." noindex />
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-4">
        <div className="flex justify-center">{contenido.icono}</div>
        <h1 className="text-xl font-bold text-gray-900">{contenido.titulo}</h1>
        {numero && <p className="text-sm font-semibold text-gray-700">Pedido #{numero}</p>}
        <p className="text-sm text-gray-600 leading-relaxed">{contenido.texto}</p>

        <div className="space-y-2 pt-2">
          {resultado === "error" ? (
            <Link
              to="/checkout"
              className="block w-full py-3 rounded-md bg-[#A47E3B] text-white font-semibold hover:bg-[#8b6d32]"
            >
              Intentar de nuevo
            </Link>
          ) : (
            <Link
              to="/home"
              className="block w-full py-3 rounded-md bg-[#A47E3B] text-white font-semibold hover:bg-[#8b6d32]"
            >
              Seguir viendo perfumes
            </Link>
          )}
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-md border border-[#A47E3B] text-[#A47E3B] font-semibold hover:bg-[#A47E3B]/10"
          >
            Escribirme por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
