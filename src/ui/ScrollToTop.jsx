import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();

  // Guardar posición scroll al salir de cada página
  useEffect(() => {
    return () => {
      sessionStorage.setItem(
        `scroll-pos-${location.key}`,
        window.scrollY.toString()
      );
    };
  }, [location.key]);

  // Restaurar (POP) o ir arriba (PUSH/REPLACE)
  useLayoutEffect(() => {
    if (navigationType === "POP") {
      const saved = sessionStorage.getItem(`scroll-pos-${location.key}`);
      if (saved !== null) {
        const targetY = parseInt(saved, 10);
        let attempts = 0;
        const maxAttempts = 20; // 20 intentos × 50ms = 1 segundo máximo

        const tryScroll = () => {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
          // Si no se logró (porque el contenido aún no carga), reintentar
          if (Math.abs(window.scrollY - targetY) > 5 && attempts < maxAttempts) {
            attempts++;
            setTimeout(tryScroll, 50);
          }
        };

        tryScroll();
        return;
      }
    }

    // PUSH/REPLACE o POP sin posición guardada: ir arriba
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.key, navigationType]);

  return null;
}

export default ScrollToTop;