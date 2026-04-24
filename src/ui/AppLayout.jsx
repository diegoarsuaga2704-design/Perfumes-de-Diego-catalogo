import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppFlotante from "./WhatsAppFlotante";
import ShoppingCart from "./ShoppingCart";
import TopBanner from "./TopBanner";
import MainMenu from "./MainMenu";
import ScrollToTop from "./ScrollToTop";
import InAppBrowserModal from "./InAppBrowserModal";

function AppLayout() {
  const [searchResult, setSearchResult] = useState(null);
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <InAppBrowserModal />
      <ScrollToTop />
      <TopBanner />
      <Header onSearchResult={setSearchResult} />
      <MainMenu />
      <main className="flex-1">
        <Outlet context={{ searchResult }} />
      </main>
      <ShoppingCart />
      <Footer />
      <WhatsAppFlotante />
    </div>
  );
}

export default AppLayout;
