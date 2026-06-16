/**
 * Copia texto al portapapeles de forma robusta.
 * Primero intenta la API moderna (navigator.clipboard); si está bloqueada
 * (común en los navegadores in-app de TikTok/Instagram), cae a un respaldo
 * con <textarea> + execCommand("copy").
 *
 * @param {string} texto
 * @returns {Promise<boolean>} true si se copió
 */
export async function copiarTexto(texto) {
  // 1) API moderna (necesita contexto seguro; a veces bloqueada en in-app)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // cae al método de respaldo
  }
  // 2) Respaldo: textarea + execCommand (funciona en más navegadores in-app)
  try {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, texto.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
