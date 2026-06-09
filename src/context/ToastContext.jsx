import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext();

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (mensaje, tipo = "info", duracion = 4000) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, mensaje, tipo }]);
      if (duracion > 0) {
        setTimeout(() => dismiss(id), duracion);
      }
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const ESTILOS = {
  success: { icon: CheckCircle2, clase: "bg-emerald-600" },
  error: { icon: AlertCircle, clase: "bg-red-600" },
  info: { icon: Info, clase: "bg-[#2C2C2C]" },
};

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[92%] max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const { icon: Icon, clase } = ESTILOS[t.tipo] || ESTILOS.info;
        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-2 ${clase} text-white px-4 py-3 rounded-lg shadow-lg text-sm`}
          >
            <Icon size={18} className="shrink-0 mt-0.5" />
            <span className="flex-1">{t.mensaje}</span>
            <button
              onClick={() => onDismiss(t.id)}
              className="shrink-0 opacity-80 hover:opacity-100"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return ctx;
}