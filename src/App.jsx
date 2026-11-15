import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ClientLayout from "./components/ClientLayout.jsx";
import MenuPage from "./pages/MenuPage.jsx";
import OrderPage from "./pages/OrderPage.jsx";

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin.jsx"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout.jsx"));
const OrdersBoard = lazy(() => import("./pages/admin/OrdersBoard.jsx"));
const MenuAdmin = lazy(() => import("./pages/admin/MenuAdmin.jsx"));
const Stats = lazy(() => import("./pages/admin/Stats.jsx"));

const Loading = () => <div className="grid min-h-dvh place-items-center text-lince-900/60">Cargando...</div>;

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<ClientLayout />}>
          <Route index element={<MenuPage />} />
          <Route path="pedido/:id" element={<OrderPage />} />
        </Route>
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<OrdersBoard />} />
          <Route path="menu" element={<MenuAdmin />} />
          <Route path="estadisticas" element={<Stats />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
