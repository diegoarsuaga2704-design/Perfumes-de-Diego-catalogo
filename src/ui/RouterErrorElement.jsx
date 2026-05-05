import { useRouteError } from "react-router-dom";

export default function RouterErrorElement() {
  const error = useRouteError();
  console.error("Router capturó un error:", error);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-md max-w-md w-full p-8 text-center border border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Algo salió mal
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Encontramos un problema inesperado. Si el error continúa, escríbeme por WhatsApp y lo resuelvo.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { window.location.href = "/"; }}
            className="bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-colors"
          >
            Volver al inicio
          </button>
          <button
            onClick={() => {
              window.open(
                "https://wa.me/5212212034647?text=Hola%20Diego%2C%20encontr%C3%A9%20un%20error%20en%20la%20p%C3%A1gina",
                "_blank",
                "noopener,noreferrer"
              );
            }}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-5 py-2.5 rounded-md font-semibold text-sm transition-colors"
          >
            Avisar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}