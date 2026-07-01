import { useState, Suspense, useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import NewsletterSignup from "./NewsletterSignup";
import NewsletterPopup from "./NewsletterPopup";
import WhatsAppFlotante from "./WhatsAppFlotante";
import ShoppingCart from "./ShoppingCart";
import TopBanner from "./TopBanner";
import MainMenu from "./MainMenu";
import ScrollToTop from "./ScrollToTop";
import InAppBrowserModal from "./InAppBrowserModal";
import LoadingSpinner from "./LoadingSpinner";
import { useToast } from "../context/ToastContext";
import { guardarCupon } from "../functions/cuponBienvenida";

function AppLayout() {
  const [searchResult, setSearchResult] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // Cupón por link de correo: ?cupon=BIENVENIDAXXXX -> lo guarda para que se
  // auto-aplique en el carrito al haber decants, limpia la URL y avisa.
  useEffect(() => {
    const cupon = searchParams.get("cupon");
    if (!cupon) return;
    // El rastreo de clics del correo a veces ensucia/duplica el parámetro.
    // Extraemos el código limpio (BIENVENIDA + 6 caracteres). Si no aparece,
    // usamos lo que llegó tal cual.
    const m = cupon.toUpperCase().match(/BIENVENIDA[0-9A-F]{6}/);
    const limpio = m ? m[0] : cupon.trim().toUpperCase();
    guardarCupon(limpio);
    const next = new URLSearchParams(searchParams);
    next.delete("cupon");
    setSearchParams(next, { replace: true });
    showToast(`Cupón ${limpio} listo: 10% en decants 🎉`, "success");
  }, [searchParams, setSearchParams, showToast]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-clip">
      <InAppBrowserModal />
      <ScrollToTop />
      <TopBanner />
      <div className="sticky top-0 z-30 shadow-sm">
        <Header onSearchResult={setSearchResult} />
        <MainMenu />
      </div>
      <main className="flex-1">
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet context={{ searchResult }} />
        </Suspense>
      </main>
      <ShoppingCart />
      <NewsletterSignup />
      <Footer />
      <WhatsAppFlotante />
      <NewsletterPopup />
    </div>
  );
}

export default AppLayout;
