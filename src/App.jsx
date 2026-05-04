import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Explorar from './pages/Explorar'
import LanzarIdea from './pages/LanzarIdea'
import Proyectos from './pages/Proyectos'
import Perfil from './pages/Perfil'
import Dashboard from './pages/Dashboard'
import Registro from './pages/Registro'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/lanzar" element={<LanzarIdea />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </AuthProvider>
  )
}
