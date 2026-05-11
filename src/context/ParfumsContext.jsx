import { createContext, useContext, useEffect, useState, useCallback } from "react";
import getParfums from "../functions/getParfums";

const ParfumsContext = createContext();

export function ParfumsProvider({ children }) {
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchParfums = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getParfums();

      // Normalizar datos desde origen (mismo patrón que ProductGrid usaba)
      const cleanData = data.map((p) => ({
        ...p,
        nombre: p.nombre ?? "",
        casa: p.casa ?? "",
        precio: p.precio ?? 0,
        disponible: p.disponible ?? "",
        categoria: p.categoria ?? "",
      }));

      setParfums(cleanData);
      setError(null);
    } catch (err) {
      console.error("Error cargando perfumes:", err);
      setError("Error al cargar los perfumes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParfums();
  }, [fetchParfums]);

  return (
    <ParfumsContext.Provider
      value={{
        parfums,
        loading,
        error,
        refresh: fetchParfums, // por si quieres recargar manualmente
      }}
    >
      {children}
    </ParfumsContext.Provider>
  );
}

export function useParfums() {
  return useContext(ParfumsContext);
}