import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary capturó:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-md max-w-md w-full p-8 text-center border border-gray-200">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Algo salió mal
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              Encontramos un problema inesperado.
            </p>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="bg-[#A47E3B] hover:bg-[#D4AF7A] text-white px-5 py-2.5 rounded-md font-semibold text-sm"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;