import { useCallback, useEffect, useRef, useState } from "react";

// Fila que se desliza de lado. En celular se desliza con el dedo; en
// computadora (md+) aparecen flechas ‹ › a los lados (fuera de la fila, para
// no tapar nada) y, si `rueda` es true, la rueda del mouse la mueve de lado.
export default function FilaDeslizable({ children, className = "", rueda = false, colorFlecha = "#C9A24B", colorTexto = "#123B29" }) {
  const ref = useRef(null);
  const [izq, setIzq] = useState(false);
  const [der, setDer] = useState(false);

  const medir = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setIzq(el.scrollLeft > 2);
    setDer(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  // Vuelve a medir cuando cambia el contenido o el tamaño.
  useEffect(() => {
    medir();
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    ro?.observe(el);
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    if (rueda) el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro?.disconnect();
      if (rueda) el.removeEventListener("wheel", onWheel);
    };
  }, [rueda, medir]);

  const mover = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  // Sin fila desbordada no hay flechas; si sí, ocupan su lugar (aunque una
  // esté apagada) para que la fila no brinque.
  const hayFlechas = izq || der;
  const flecha = (dir, activa) => (
    <button
      type="button"
      aria-label={dir < 0 ? "Ver anteriores" : "Ver más"}
      onClick={() => mover(dir)}
      disabled={!activa}
      tabIndex={activa ? 0 : -1}
      className={`${hayFlechas ? "hidden md:flex" : "hidden"} shrink-0 w-8 h-8 rounded-full items-center justify-center text-lg font-bold shadow-lg ${
        activa ? "" : "invisible"
      }`}
      style={{ background: colorFlecha, color: colorTexto }}
    >
      {dir < 0 ? "‹" : "›"}
    </button>
  );

  return (
    <div className="md:flex md:items-center md:gap-2">
      {flecha(-1, izq)}
      <div ref={ref} onScroll={medir} className={`min-w-0 md:flex-1 ${className}`} style={{ scrollbarWidth: "none" }}>
        {children}
      </div>
      {flecha(1, der)}
    </div>
  );
}
