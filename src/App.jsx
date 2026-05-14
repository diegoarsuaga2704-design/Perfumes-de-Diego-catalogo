import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
import FAQs from "./pages/FAQs";
import Testimonios from "./pages/Testimonios";
import BestSellers from "./pages/BestSellers";
import VistoEnTikTok from "./pages/VistoEnTikTok";
import Paquetes from "./pages/Paquetes";
import AppLayout from "./ui/AppLayout";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Prehome from "./pages/Prehome";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import AdminPerfumesList from "./pages/AdminPerfumesList";
import AdminPerfumeEdit from "./pages/AdminPerfumeEdit";
import AdminPerfumeCreate from "./pages/AdminPerfumeCreate";
import AdminPaquetesList from "./pages/AdminPaquetesList";
import AdminPaqueteCreate from "./pages/AdminPaqueteCreate";
import AdminPaqueteEdit from "./pages/AdminPaqueteEdit";
import AdminTestimoniosList from "./pages/AdminTestimoniosList";
import AdminTestimonioCreate from "./pages/AdminTestimonioCreate";
import AdminTestimonioEdit from "./pages/AdminTestimonioEdit";
import AdminCasasList from "./pages/AdminCasasList";
import AdminCasaEdit from "./pages/AdminCasaEdit";
import Casas from "./pages/Casas";
import ProtectedAdminRoute from "./ui/ProtectedAdminRoute";
import RouterErrorElement from "./ui/RouterErrorElement";

const router = createBrowserRouter([
  // Rutas públicas con AppLayout
  {
    element: <AppLayout />,
    errorElement: <RouterErrorElement />,
    children: [
      { path: "/", element: <Prehome /> },
      { path: "/home", element: <Home /> },
      { path: "/botellas", element: <Home forcedMode="stock" /> },
      { path: "/decants", element: <Home forcedMode="decants" /> },
      { path: "/casa/:slug", element: <Home /> },
      { path: "/faqs", element: <FAQs /> },
      { path: "/testimonios", element: <Testimonios /> },
      { path: "/casas", element: <Casas /> },
      { path: "/best-sellers", element: <BestSellers /> },
      { path: "/tiktok", element: <VistoEnTikTok /> },
      { path: "/paquetes", element: <Paquetes /> },
      { path: "/product/:nombre/:id", element: <ProductDetail /> },
      { path: "*", element: <NotFound /> },
    ],
  },

  // Rutas de admin (sin AppLayout)
  {
    path: "/admin/login",
    element: <AdminLogin />,
    errorElement: <RouterErrorElement />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedAdminRoute>
        <AdminPanel />
      </ProtectedAdminRoute>
    ),
    errorElement: <RouterErrorElement />,
  },

  // Perfumes admin
  {
    path: "/admin/perfumes",
    element: (
      <ProtectedAdminRoute>
        <AdminPerfumesList />
      </ProtectedAdminRoute>
    ),
    errorElement: <RouterErrorElement />,
  },
  {
    path: "/admin/perfumes/nuevo",
    element: (
      <ProtectedAdminRoute>
        <AdminPerfumeCreate />
      </ProtectedAdminRoute>
    ),
    errorElement: <RouterErrorElement />,
  },
  {
    path: "/admin/perfumes/:id",
    element: (
      <ProtectedAdminRoute>
        <AdminPerfumeEdit />
      </ProtectedAdminRoute>
    ),
    errorElement: <RouterErrorElement />,
  },

  // Paquetes admin
  {
    path: "/admin/paquetes",
    element: (
      <ProtectedAdminRoute>
        <AdminPaquetesList />
      </ProtectedAdminRoute>
    ),
    errorElement: <RouterErrorElement />,
  },
  {
    path: "/admin/paquetes/nuevo",
    element: (
      <ProtectedAdminRoute>
        <AdminPaqueteCreate />
      </ProtectedAdminRoute>
    ),
    errorElement: <RouterErrorElement />,
  },
  {
    path: "/admin/paquetes/:id",
    element: (
      <ProtectedAdminRoute>
        <AdminPaqueteEdit />
      </ProtectedAdminRoute>
    ),
    errorElement: <RouterErrorElement />,
  },

  // Testimonios admin
  {
    path: "/admin/testimonios",
    element: (
      <ProtectedAdminRoute>
        <AdminTestimoniosList />
      </ProtectedAdminRoute>
    ),
    errorElement: <RouterErrorElement />,
  },
  {
    path: "/admin/testimonios/nuevo",
    element: (
      <ProtectedAdminRoute>
        <AdminTestimonioCreate />
      </ProtectedAdminRoute>
    ),
    errorElement: <RouterErrorElement />,
  },
  {
    path: "/admin/testimonios/:id",
    element: (
      <ProtectedAdminRoute>
        <AdminTestimonioEdit />
      </ProtectedAdminRoute>
    ),
    errorElement: <RouterErrorElement />,
  },

  // Casas admin
  {
    path: "/admin/casas",
    element: (
      <ProtectedAdminRoute>
        <AdminCasasList />
      </ProtectedAdminRoute>
    ),
    errorElement: <RouterErrorElement />,
  },
  {
    path: "/admin/casas/:id",
    element: (
      <ProtectedAdminRoute>
        <AdminCasaEdit />
      </ProtectedAdminRoute>
    ),
    errorElement: <RouterErrorElement />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
