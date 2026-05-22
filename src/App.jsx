import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import AssistantWidget from './components/AssistantWidget'
import Home from './pages/Home'
import Explorar from './pages/Explorar'
import LanzarIdea from './pages/LanzarIdea'
import Proyectos from './pages/Proyectos'
import Perfil from './pages/Perfil'
import Dashboard from './pages/Dashboard'
import Registro from './pages/Registro'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Precios from './pages/Precios'
import ProyectoDetalle from './pages/ProyectoDetalle'
import PerfilPublico from './pages/PerfilPublico'
import AuthCallback from './pages/AuthCallback'
import ProyectoPanel from './pages/ProyectoPanel'
import CV from './pages/CV'
import FAQ from './pages/FAQ'
import ProfileChat from './pages/ProfileChat'
import CVChat from './pages/CVChat'

const FOOTER_TEXT = '© 2026 Equia · Beta\nIdea por Nicolás Hercun · Diseñado y desarrollado por Guillermo Muhana\n🇦🇷 ↔ 🇺🇸'

function Footer() {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const iv = setInterval(() => {
      i++
      setDisplayed(FOOTER_TEXT.slice(0, i))
      if (i >= FOOTER_TEXT.length) { clearInterval(iv); setDone(true) }
    }, 38)
    return () => clearInterval(iv)
  }, [])

  return (
    <footer style={{
      borderTop: '1px solid #e8e8e8',
      padding: 'clamp(12px,3vw,18px) clamp(16px,6vw,32px)',
      textAlign: 'center',
      fontSize: 'clamp(10px,2.8vw,12px)',
      color: '#bbb',
      background: '#fff',
      fontFamily: 'Inter, sans-serif',
      letterSpacing: '0.3px',
      lineHeight: 1.8,
      wordBreak: 'break-word',
      whiteSpace: 'pre-line',
    }}>
      {displayed}
      <span style={{ opacity: done ? 0 : 1, animation: done ? 'none' : 'blink 1s infinite', marginLeft: 1 }}>|</span>
    </footer>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
<AssistantWidget />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/lanzar" element={<LanzarIdea />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/talento/:id" element={<PerfilPublico />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/precios" element={<Precios />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/panel/:id" element={<ProyectoPanel />} />
        <Route path="/cv" element={<CV />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/perfil-chat" element={<ProfileChat />} />
        <Route path="/cv-chat" element={<CVChat />} />
      </Routes>
      <Footer />
    </AuthProvider>
  )
}
