import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, CartProvider, OrdersProvider, ThemeProvider } from '@/lib/context'
import { Header, Footer, FloatingWhatsAppButton } from '@/components/layout'
import { Home } from './Home'
import { Products } from './Products'
import { Cart } from './Cart'
import { Orders } from './Orders'
import { Profile } from './Profile'
import { Admin } from './Admin'
import { Login } from './Login'
import { Signup } from './Signup'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <OrdersProvider>
            <CartProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                </Routes>
              </main>
              <Footer />
              <FloatingWhatsAppButton />
              </div>
            </CartProvider>
          </OrdersProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

