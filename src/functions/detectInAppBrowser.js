/**
 * Detecta si el usuario está navegando dentro de un in-app browser
 * (TikTok, Instagram, Facebook). Estos browsers bloquean wa.me y otros
 * deep-links, por lo que necesitamos avisar al usuario.
 *
 * @returns {{ isInApp: boolean, platform: 'ios' | 'android', source: string | null }}
 */
export function detectInAppBrowser() {
  if (typeof navigator === "undefined") {
    return { isInApp: false, platform: "android", source: null };
  }

  const ua = navigator.userAgent || navigator.vendor || "";
  const platform = /iPad|iPhone|iPod/i.test(ua) ? "ios" : "android";

  let source = null;
  if (/TikTok/i.test(ua) || /musical_ly/i.test(ua) || /BytedanceWebview/i.test(ua)) {
    source = "TikTok";
  } else if (/Instagram/i.test(ua)) {
    source = "Instagram";
  } else if (/FBAN|FBAV/i.test(ua)) {
    source = "Facebook";
  }

  return { isInApp: !!source, platform, source };
}