import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { PageLoader } from './components/common/PageLoader';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Layouts (loaded immediately as the application shell)
import { PublicLayout } from './layouts/PublicLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { FarmerLayout } from './layouts/FarmerLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages (Lazy Loaded on-demand)
const HomePage = lazy(() => import('./pages/public/HomePage').then((m) => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import('./pages/public/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/public/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const FarmersPage = lazy(() => import('./pages/public/FarmersPage').then((m) => ({ default: m.FarmersPage })));
const FarmerDetailPage = lazy(() => import('./pages/public/FarmerDetailPage').then((m) => ({ default: m.FarmerDetailPage })));
const AboutPage = lazy(() => import('./pages/public/AboutPage').then((m) => ({ default: m.AboutPage })));

// Auth Pages (Lazy Loaded)
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));

// Customer Pages (Lazy Loaded)
const CartPage = lazy(() => import('./pages/customer/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const CustomerDashboardPage = lazy(() => import('./pages/customer/CustomerDashboardPage').then((m) => ({ default: m.CustomerDashboardPage })));
const OrdersPage = lazy(() => import('./pages/customer/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('./pages/customer/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const AddressesPage = lazy(() => import('./pages/customer/AddressesPage').then((m) => ({ default: m.AddressesPage })));
const CustomerProfilePage = lazy(() => import('./pages/customer/CustomerProfilePage').then((m) => ({ default: m.CustomerProfilePage })));

// Farmer Pages (Lazy Loaded)
const FarmerDashboardPage = lazy(() => import('./pages/farmer/FarmerDashboardPage').then((m) => ({ default: m.FarmerDashboardPage })));
const FarmerProductsPage = lazy(() => import('./pages/farmer/FarmerProductsPage').then((m) => ({ default: m.FarmerProductsPage })));
const AddEditProductPage = lazy(() => import('./pages/farmer/AddEditProductPage').then((m) => ({ default: m.AddEditProductPage })));
const FarmerOrdersPage = lazy(() => import('./pages/farmer/FarmerOrdersPage').then((m) => ({ default: m.FarmerOrdersPage })));
const FarmerEarningsPage = lazy(() => import('./pages/farmer/FarmerEarningsPage').then((m) => ({ default: m.FarmerEarningsPage })));
const FarmerProfilePage = lazy(() => import('./pages/farmer/FarmerProfilePage').then((m) => ({ default: m.FarmerProfilePage })));

// Admin Pages (Lazy Loaded)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminFarmersPage = lazy(() => import('./pages/admin/AdminFarmersPage').then((m) => ({ default: m.AdminFarmersPage })));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage').then((m) => ({ default: m.AdminCustomersPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                  {/* Public & Customer Routes under PublicLayout */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/farmers" element={<FarmersPage />} />
                    <Route path="/farmers/:id" element={<FarmerDetailPage />} />
                    <Route path="/about" element={<AboutPage />} />

                    {/* Auth */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ForgotPasswordPage />} />

                    {/* Cart & Checkout */}
                    <Route path="/cart" element={<CartPage />} />
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <CheckoutPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Order Tracking */}
                    <Route
                      path="/orders/:id"
                      element={
                        <ProtectedRoute>
                          <OrderDetailPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Customer Portal Subnav */}
                    <Route
                      path="/customer"
                      element={
                        <ProtectedRoute>
                          <CustomerLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<CustomerDashboardPage />} />
                      <Route path="orders" element={<OrdersPage />} />
                      <Route path="addresses" element={<AddressesPage />} />
                      <Route path="profile" element={<CustomerProfilePage />} />
                    </Route>

                    {/* Alias for /orders -> /customer/orders */}
                    <Route path="/orders" element={<Navigate to="/customer/orders" replace />} />
                  </Route>

                  {/* Farmer Studio Portal */}
                  <Route
                    path="/farmer"
                    element={
                      <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
                        <FarmerLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<FarmerDashboardPage />} />
                    <Route path="products" element={<FarmerProductsPage />} />
                    <Route path="products/new" element={<AddEditProductPage />} />
                    <Route path="products/:id/edit" element={<AddEditProductPage />} />
                    <Route path="orders" element={<FarmerOrdersPage />} />
                    <Route path="earnings" element={<FarmerEarningsPage />} />
                    <Route path="profile" element={<FarmerProfilePage />} />
                  </Route>

                  {/* Admin Console Portal */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="farmers" element={<AdminFarmersPage />} />
                    <Route path="customers" element={<AdminCustomersPage />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="categories" element={<AdminCategoriesPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                  </Route>

                  {/* 404 Catch-all */}
                  <Route
                    path="*"
                    element={
                      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <span className="text-6xl">🌾</span>
                        <h1 className="text-3xl font-extrabold text-darkText">Page Not Found</h1>
                        <p className="text-sm text-grayText max-w-sm">
                          The farm trail you were following does not exist or has moved.
                        </p>
                        <Link
                          to="/"
                          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-medium text-white bg-primary hover:bg-primary-700 shadow-sm transition-all"
                        >
                          Return to Marketplace
                        </Link>
                      </div>
                    }
                  />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
