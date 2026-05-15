import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ChatWidget from './components/ChatWidget'
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

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <ChatWidget />
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
      </Routes>
    </AuthProvider>
  )
}
