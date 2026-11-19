import { createContext, useContext, useMemo, useState } from "react";
import { compararPerfumes } from "../functions/ordenarPerfumes";

// Orden del catálogo: casa (A-Z, Z-A o juntas) + precio o nombre.
// La comparación vive en functions/ordenarPerfumes.js.
const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [ordenCasa, setOrdenCasa] = useState("az");
  const [ordenDentro, setOrdenDentro] = useState("precio");

  const valor = useMemo(
    () => ({
      ordenCasa,
      setOrdenCasa,
      ordenDentro,
      setOrdenDentro,
      // Clave única del orden actual (sirve para saber cuándo cambió).
      order: `${ordenCasa}|${ordenDentro}`,
      comparar: (a, b) => compararPerfumes(a, b, ordenCasa, ordenDentro),
    }),
    [ordenCasa, ordenDentro],
  );

  return <OrderContext.Provider value={valor}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  return useContext(OrderContext);
}
