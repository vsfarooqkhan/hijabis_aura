import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'
import useStore from '../store/useStore'
import Logo from '../components/Logo'
import { Field } from '../components/ui'
import AdminLayout from './AdminLayout'
import Dashboard from './Dashboard'
import Products from './Products'
import ProductEditor from './ProductEditor'
import { Orders, OrderDetail } from './Orders'
import { Customers, Collections, Coupons, Reviews } from './Catalog'
import Settings from './Settings'
import { NotFoundPage } from '../pages/Misc'

export default function AdminRoutes() {
  const signedIn = useStore((s) => !!s.admin.email)

  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={signedIn ? <AdminLayout /> : <Navigate to="/admin/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductEditor />} />
        <Route path="collections" element={<Collections />} />
        <Route path="customers" element={<Customers />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

/**
 * Demo gate, not authentication. Any password gets you in — the point is to
 * show the shape of the screen. Real auth arrives with the backend, and this
 * component is where it plugs in.
 */
function Login() {
  const navigate = useNavigate()
  const signIn = useStore((s) => s.signIn)
  const brandName = useStore((s) => s.settings.brand.name)
  const [email, setEmail] = useState('admin@hijabisaura.in')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter the email you use for the dashboard.')
      return
    }
    if (password.length < 4) {
      setError('Any password of four characters or more works in this demo.')
      return
    }
    signIn(email)
    navigate('/admin', { replace: true })
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo size="lg" tone="onInk" showTagline className="justify-center" />
        </div>

        <form onSubmit={submit} className="bg-blush p-7">
          <h1 className="display-sm text-xl">Dashboard sign-in</h1>
          <p className="mt-1.5 font-mono text-2xs leading-relaxed text-taupe">
            {brandName} operations. Orders, stock, dye card and settings.
          </p>

          <div className="mt-6 space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              autoComplete="username"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              autoComplete="current-password"
              error={error}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-ink mt-6 w-full">
            <Lock size={15} />
            Sign in
            <ArrowRight size={15} />
          </button>

          <p className="mt-5 border-t border-ink/10 pt-4 font-mono text-2xs leading-relaxed text-taupe">
            Demo only — any password of four characters or more is accepted, and nothing here is a
            security boundary. Data lives in this browser.
          </p>
        </form>
      </div>
    </div>
  )
}
