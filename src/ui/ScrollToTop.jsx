import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// El navegador hace su propia restauración de scroll y pelea con la de este
// componente. La apagamos para que el control lo tenga solo nuestro código.
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

// Estas dos variables viven a nivel de módulo: se reinician solas en cada carga
// completa del documento (F5 o entrar de cero), pero NO cuando el usuario
// navega dentro del sitio. Sirven para distinguir una recarga de un
// "atrás/adelante" real, porque React Router reporta POP en los dos casos.
// No usamos una bandera de "primera vez" porque StrictMode ejecuta los efectos
// dos veces en desarrollo y la consumiría antes de tiempo.
let keyInicial = null;
let huboNavegacion = false;

function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();

  // Guardar posición de scroll al salir de cada página
  useEffect(() => {
    return () => {
      sessionStorage.setItem(
        `scroll-pos-${location.key}`,
        window.scrollY.toString(),
      );
    };
  }, [location.key]);

  // Restaurar (atrás/adelante) o ir arriba (recarga, PUSH/REPLACE)
  useLayoutEffect(() => {
    if (keyInicial === null) keyInicial = location.key;
    if (location.key !== keyInicial) huboNavegacion = true;

    const irArriba = () =>
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    // Sube ahora y en los siguientes frames, por si el contenido (rutas lazy o
    // datos async) termina de montar y desplaza el scroll.
    const subirYAsegurar = () => {
      irArriba();
      const raf = requestAnimationFrame(() => {
        irArriba();
        requestAnimationFrame(irArriba);
      });
      return () => cancelAnimationFrame(raf);
    };

    // Carga completa del documento (recarga o entrada directa): siempre arriba.
    // La posición guardada en sessionStorage es de la sesión anterior de esta
    // pestaña, no de esta carga, así que no se restaura.
    if (!huboNavegacion) return subirYAsegurar();

    if (navigationType === "POP") {
      const saved = sessionStorage.getItem(`scroll-pos-${location.key}`);
      if (saved !== null) {
        const targetY = parseInt(saved, 10);
        let attempts = 0;
        const maxAttempts = 20; // 20 intentos × 50ms = 1 segundo máximo
        let timer = null;

        const tryScroll = () => {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
          // Si no se logró (porque el contenido aún no carga), reintentar
          if (Math.abs(window.scrollY - targetY) > 5 && attempts < maxAttempts) {
            attempts++;
            timer = setTimeout(tryScroll, 50);
          }
        };

        tryScroll();
        // Si el usuario navega mientras reintentamos, cortamos el bucle: si no,
        // seguiría arrastrando el scroll de la página nueva.
        return () => clearTimeout(timer);
      }
    }

    // PUSH/REPLACE (o POP sin posición guardada): ir arriba.
    return subirYAsegurar();
  }, [location.key, navigationType]);

  return null;
}

export default ScrollToTop;
