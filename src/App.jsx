import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './components/pages/Home'
import Footer from './components/Footer'
import ProductDetails from './components/pages/ProductDetails'
import LipstickAR from "./AR/LipstickAR";
import Signup from "@/components/forms/Signup"
import Login from "@/components/forms/Login"
import Dashboard from "@/components/admin-dashboard/Dashboard"
import ProductCreate from "@/components/admin-dashboard/ProductCreate"
import ProductEdit from "@/components/admin-dashboard/ProductEdit"


const App = () => {
  const location = useLocation()
  const hideLayout = location.pathname.startsWith('/dashboard')

  return (
    <main>
      {!hideLayout && <Navbar />}
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/product/:id" element={<ProductDetails/>} />
        <Route
          path="/ar/lipstick"
          element={
            <div className="min-h-screen bg-gray-50 p-6">
              <h1 className="text-2xl font-semibold mb-4  mt-10">Lipstick AR Test</h1>
              <LipstickAR />
            </div>
          }
        />
        <Route path='/signup' element={<Signup/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/dashboard' element={<Dashboard/>}/>
        <Route path='/dashboard/products/new' element={<ProductCreate/>}/>
        <Route path='/dashboard/products/:id/edit' element={<ProductEdit/>}/>
      </Routes>
      {!hideLayout && <Footer />}
    </main>
  )
}

export default App
