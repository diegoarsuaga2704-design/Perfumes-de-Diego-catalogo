import { useState } from "react";
import { Link } from "react-router-dom";
import { FaTiktok } from "react-icons/fa";
import { Package } from "lucide-react";
import { slugify } from "../functions/slugify";
import { getBadgeEstatus } from "../functions/getBadgeEstatus";
import { formatPrecio } from "../functions/formatPrecio";
import { imagenThumb } from "../functions/imagenThumb";
import { formatNotasTexto } from "../functions/formatNotas";
import { estadoGrupo, esMismoPerfume } from "../functions/mismoPerfume";
import { useParfums } from "../context/ParfumsContext";

function ProductCard({ parfum }) {
  const [imgError, setImgError] = useState(false);
  const [usarOriginal, setUsarOriginal] = useState(false);

  const { parfums: catalogo = [] } = useParfums() || {};

  // Un solo badge, misma lógica que ProductDetail (fuente única). La
  // disponibilidad es la del perfume en conjunto: si hay decant pero no
  // botella (o al revés), sale disponible.
  const badge = getBadgeEstatus({ ...parfum, disponible: estadoGrupo(parfum, catalogo) });

  // Video de TikTok: el de esta versión o el de la otra (decant ↔ botella).
  const tiktokLink =
    parfum.tiktokLink ||
    catalogo.find((p) => p.tiktokLink && esMismoPerfume(parfum, p))?.tiktokLink ||
    null;

  return (
    <div
      className="bg-white relative shadow-md rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col"
    >
      {/* Enlace real que cubre toda la tarjeta: permite abrir en otra pestaña
          (o pulsación larga en el celular) y que Google siga el enlace. */}
      <Link
        to={`/product/${slugify(parfum.nombre)}/${parfum.id}`}
        aria-label={parfum.nombre}
        className="absolute inset-0 z-[5]"
      />

      {/* Badge de estatus (esquina superior derecha) — un solo badge */}
      {badge && (
        <span
          className={`absolute top-2 right-2 z-10 pointer-events-none text-white text-xs sm:text-sm font-semibold px-3 py-1 rounded-md ${badge.color}`}
        >
          {badge.texto}
        </span>
      )}

      {/* Imagen en un cuadro de tamaño fijo: todas las tarjetas miden lo mismo
          sin importar la proporción de la foto. */}
      <div className="relative aspect-square w-full overflow-hidden bg-white flex items-center justify-center">
        {parfum.image && !imgError ? (
          <img
            src={usarOriginal ? parfum.image : imagenThumb(parfum.image, 450)}
            alt={parfum.nombre}
            loading="lazy"
            decoding="async"
            onError={() =>
              usarOriginal ? setImgError(true) : setUsarOriginal(true)
            }
            className="absolute inset-0 h-full w-full object-contain p-2"
          />
        ) : (
          <Package className="text-gray-300" size={48} />
        )}
      </div>

      {/* Texto con alturas fijas: nombre (2 renglones), casa (1 renglón),
          precio y notas (2 renglones) siempre en el mismo lugar. */}
      <div className="sm:p-5 px-2 py-4 flex flex-col flex-1">
        <h3 className="sm:text-lg text-sm font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem] sm:min-h-[3.5rem]">
          {parfum.nombre}
        </h3>
        <p className="text-gray-500 text-sm truncate mt-1 mb-3">{parfum.casa}</p>
        <div className="border-t border-gray-200 pt-3 flex flex-col flex-1">
          <span className="text-gray-900 text-base sm:text-lg font-semibold">
            ${formatPrecio(parfum.precio)}
            {!parfum.stock && "/ml"}
          </span>
          <span className="text-[11px] text-[#A47E3B] font-semibold min-h-[1rem]">
            {parfum.formatos?.decant && parfum.formatos?.botella ? "Decant y botella" : ""}
          </span>
          <div className="hidden sm:block mt-1 min-h-[2.5rem]">
            <p className="text-[13px] leading-5 text-gray-600 line-clamp-2">
              {formatNotasTexto(parfum.notas)}
            </p>
          </div>

          {tiktokLink && (
            <a
              href={tiktokLink}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 mt-auto pt-2 inline-flex items-center justify-center gap-1 text-[10px] sm:text-xs text-[#A47E3B] hover:text-[#D4AF7A] font-semibold w-fit"
            >
              <span className="inline-flex items-center gap-1 border border-[#A47E3B] rounded-md py-1 px-2">
                <FaTiktok className="h-3 w-3" />
                Ver video
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;