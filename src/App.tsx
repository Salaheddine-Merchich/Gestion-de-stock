import { Toaster } from "@/presentation/components/ui/toaster";
import { Toaster as Sonner } from "@/presentation/components/ui/sonner";
import { TooltipProvider } from "@/presentation/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/application/contexts/AuthContext";
import { CartProvider } from "@/application/contexts/CartContext";
import { ProtectedRoute } from "@/presentation/components/shared/ProtectedRoute";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { ClientLayout } from "@/presentation/layouts/ClientLayout";
import { Layout } from "@/presentation/layouts/Layout";
import LandingPage from "@/presentation/pages/LandingPage";
import AuthPage from "@/features/auth/pages/AuthPage";
import NotFoundPage from "@/presentation/pages/NotFoundPage";
import AdminDashboard from "@/features/admin/pages/Dashboard";
import AdminProducts from "@/features/admin/pages/Products";
import AdminCategories from "@/features/admin/pages/Categories";
import AdminOrders from "@/features/admin/pages/Orders";
import ClientDashboard from "@/features/client/pages/Dashboard";
import ClientCart from "@/features/client/pages/Cart";
import ClientOrders from "@/features/client/pages/Orders";
import ClientInvoice from "@/features/client/pages/Invoice";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route index element={<AdminDashboard />} />
              </Route>

              {/* Client Routes */}
              <Route path="/client" element={
                <ProtectedRoute requiredRole="client">
                  <ClientLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<ClientDashboard />} />
                <Route path="cart" element={<ClientCart />} />
                <Route path="orders" element={<ClientOrders />} />
                <Route path="invoice/:orderId" element={<ClientInvoice />} />
                <Route index element={<ClientDashboard />} />
              </Route>

              {/* Public Routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<LandingPage />} />
              </Route>
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

