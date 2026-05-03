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
import AdminPerfumesList from "./pages/AdminPerfumesList";
import AdminPerfumeEdit from "./pages/AdminPerfumeEdit";
import AdminPerfumeCreate from "./pages/AdminPerfumeCreate";
import AdminPaquetesList from "./pages/AdminPaquetesList";
import AdminPaqueteCreate from "./pages/AdminPaqueteCreate";
import AdminPaqueteEdit from "./pages/AdminPaqueteEdit";
import ProtectedAdminRoute from "./ui/ProtectedAdminRoute";

const router = createBrowserRouter([
  // Rutas públicas con AppLayout
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Prehome /> },
      { path: "/home", element: <Home /> },
      { path: "/faqs", element: <FAQs /> },
      { path: "/best-sellers", element: <BestSellers /> },
      { path: "/tiktok", element: <VistoEnTikTok /> },
      { path: "/product/:nombre/:id", element: <ProductDetail /> },
      { path: "*", element: <NotFound /> },
    ],
  },

  // Rutas de admin (sin AppLayout)
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

  // Perfumes
  {
    path: "/admin/perfumes",
    element: (
      <ProtectedAdminRoute>
        <AdminPerfumesList />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/perfumes/nuevo",
    element: (
      <ProtectedAdminRoute>
        <AdminPerfumeCreate />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/perfumes/:id",
    element: (
      <ProtectedAdminRoute>
        <AdminPerfumeEdit />
      </ProtectedAdminRoute>
    ),
  },

  // Paquetes
  {
    path: "/admin/paquetes",
    element: (
      <ProtectedAdminRoute>
        <AdminPaquetesList />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/paquetes/nuevo",
    element: (
      <ProtectedAdminRoute>
        <AdminPaqueteCreate />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin/paquetes/:id",
    element: (
      <ProtectedAdminRoute>
        <AdminPaqueteEdit />
      </ProtectedAdminRoute>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
