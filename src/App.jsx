import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './components/pages/Home'
import Footer from './components/Footer'
import ProductDetails from './components/pages/ProductDetails'
import CartPage from './components/pages/CartPage'
import CheckoutPage from './components/pages/CheckoutPage'
import WishlistPage from './components/pages/WishlistPage'
import ShopDrawer from './components/ShopDrawer'
import ScrollToTop from './components/ScrollToTop'
import SearchPage from './components/pages/SearchPage'
import LipstickAR from "./AR/LipstickAR";
import Signup from "@/components/forms/Signup"
import Login from "@/components/forms/Login"
import Dashboard from "@/components/admin-dashboard/Dashboard"
import ProductOverview from "@/components/admin-dashboard/ProductOverview"
import ProductCreate from "@/components/admin-dashboard/ProductCreate"
import ProductEdit from "@/components/admin-dashboard/ProductEdit"
import ShadesPage from "@/components/admin-dashboard/Shades"
import ProfileLayout from "@/components/profile/ProfileLayout"
import ProfileOverview from "@/components/profile/ProfileOverview"
import Orders from "@/components/profile/Orders"
import Addresses from "@/components/profile/Addresses"
import Settings from "@/components/profile/Settings"
import MobileBottomNav from "@/components/MobileBottomNav"
import MobileTopBar from "@/components/MobileTopBar"
import { Toaster } from "@/components/ui/sonner";


const App = () => {
  const location = useLocation()
  const isDashboardRoute = location.pathname.startsWith('/dashboard')
  const isARRoute = location.pathname.startsWith('/ar')
  const hideLayout = isDashboardRoute || isARRoute
  const hideFooterOn = ["/cart", "/checkout"]
  const shouldHideFooter = hideLayout || hideFooterOn.includes(location.pathname)

  return (
    <main className="min-h-screen bg-background text-foreground">
      {!hideLayout && <Navbar />}
      {!hideLayout && <MobileTopBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route
          path="/ar/lipstick"
          element={<LipstickAR />}
        />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/login' element={<Login />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/dashboard/products' element={<ProductOverview />} />
        <Route path='/dashboard/products/new' element={<ProductCreate />} />
        <Route path='/dashboard/products/:id/edit' element={<ProductEdit />} />
        <Route path='/dashboard/shades' element={<ShadesPage />} />

        {/* Profile Routes */}
        <Route path="/profile" element={<ProfileLayout />}>
          <Route index element={<ProfileOverview />} />
          <Route path="orders" element={<Orders />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="settings" element={<Settings />} />
          <Route path="wishlist" element={<WishlistPage />} />
        </Route>
      </Routes>
      <ScrollToTop />
      <ShopDrawer />
      <Toaster position="top-center" richColors closeButton />
      {!shouldHideFooter && <Footer />}
      {!hideLayout && <MobileBottomNav />}
    </main>
  )
}

export default App
