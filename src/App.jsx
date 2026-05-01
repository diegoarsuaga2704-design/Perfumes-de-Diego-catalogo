// import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
import FAQs from "./pages/FAQs";
import BestSellers from "./pages/BestSellers";
import VistoEnTikTok from "./pages/VistoEnTikTok";
import AppLayout from "./ui/AppLayout";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Prehome from "./pages/Prehome";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import ProtectedAdminRoute from "./ui/ProtectedAdminRoute";

const router = createBrowserRouter([
  // Rutas públicas con AppLayout
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Prehome />,
      },
      {
        path: "/home",
        element: <Home />,
      },
      {
        path: "/faqs",
        element: <FAQs />,
      },
      {
        path: "/best-sellers",
        element: <BestSellers />,
      },
      {
        path: "/tiktok",
        element: <VistoEnTikTok />,
      },
      {
        path: "/product/:nombre/:id",
        element: <ProductDetail />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },

  // Rutas de admin (sin AppLayout — tienen su propio diseño)
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedAdminRoute>
        <AdminPanel />
      </ProtectedAdminRoute>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
