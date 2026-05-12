import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

function ScrollToTop() {
  const { pathname, key } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Dejar que el navegador NO restaure scroll automáticamente
    // (lo controlamos nosotros con base en el tipo de navegación)
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Si la navegación es POP (botón atrás del navegador o navigate(-1)),
    // NO hacer scroll al top: respetamos la posición previa.
    if (navigationType === "POP") return;

    // Si es PUSH (nueva navegación) o REPLACE, sí scrolleamos arriba.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, key, navigationType]);

  return null;
}

export default ScrollToTop;