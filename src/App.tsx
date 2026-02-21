import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollRestoration } from "@/components/layout/ScrollRestoration";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import ServicesPage from "./pages/ServicesPage";
import TireFinderPage from "./pages/TireFinderPage";
import DealersPage from "./pages/DealersPage";
import ContactPage from "./pages/ContactPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import FleetPage from "./pages/FleetPage";
import AboutPage from "./pages/AboutPage";
import WarrantyPage from "./pages/WarrantyPage";
import TireCarePage from "./pages/TireCarePage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import AdminPage from "./pages/AdminPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import MobileSwapPage from "./pages/MobileSwapPage";
import LeaveReviewPage from "./pages/LeaveReviewPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import GetQuotePage from "./pages/GetQuotePage";
import BundlesPage from "./pages/BundlesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollRestoration />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/bundles" element={<BundlesPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/tire-finder" element={<TireFinderPage />} />
                <Route path="/dealers" element={<DealersPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/fleet" element={<FleetPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/warranty" element={<WarrantyPage />} />
                <Route path="/tire-care" element={<TireCarePage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                <Route path="/mobile-swap" element={<MobileSwapPage />} />
                <Route path="/my-account" element={<CustomerDashboardPage />} />
                <Route path="/get-quote" element={<GetQuotePage />} />
                <Route path="/review" element={<LeaveReviewPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
