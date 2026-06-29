// Guarda el código de bienvenida del visitante para auto-aplicarlo en el
// carrito y marcarlo usado al enviar el pedido por WhatsApp.
const KEY = "cuponBienvenida";

export function guardarCupon(codigo) {
  try {
    if (codigo) localStorage.setItem(KEY, codigo);
  } catch {
    // localStorage no disponible — ignorar
  }
}

export function getCupon() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function borrarCupon() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignorar
  }
}
