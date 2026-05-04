export const ROLES = {
  visionario: {
    id: 'visionario',
    label: 'Visionario',
    icon: '💡',
    desc: 'Tengo una idea y quiero construir el equipo para ejecutarla',
    badge: 'role-visionario',
  },
  talento: {
    id: 'talento',
    label: 'Talento',
    icon: '⚡',
    desc: 'Quiero sumarme a proyectos que me apasionen',
    badge: 'role-talento',
  },
  inversor: {
    id: 'inversor',
    label: 'Inversor',
    icon: '💼',
    desc: 'Busco proyectos con equipos sólidos para invertir',
    badge: 'role-inversor',
  },
}

export const SKILL_ROLES = [
  'Full-Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Mobile Developer',
  'UI/UX Designer',
  'AI/ML Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'Product Manager',
  'Marketing & Growth',
  'Copywriter',
  'QA Engineer',
  'Blockchain Developer',
  'Cybersecurity',
]

export const CATEGORIES = [
  { icon: '🛒', label: 'E-commerce' },
  { icon: '🏥', label: 'HealthTech' },
  { icon: '🎓', label: 'EdTech' },
  { icon: '💰', label: 'FinTech' },
  { icon: '🤖', label: 'Inteligencia Artificial' },
  { icon: '📱', label: 'Mobile App' },
  { icon: '🎮', label: 'Gaming' },
  { icon: '🌱', label: 'Sustentabilidad' },
  { icon: '🚀', label: 'SaaS' },
  { icon: '🏠', label: 'PropTech' },
  { icon: '🔒', label: 'Ciberseguridad' },
  { icon: '📊', label: 'Data & Analytics' },
]

export const PROJECT_STAGES = [
  'Idea (solo concepto)',
  'Validando (con primeros usuarios)',
  'MVP en desarrollo',
  'Producto lanzado',
  'Escalando',
]

export const MOCK_TALENTS = [
  { id: 1, name: 'Sofía Ramírez', role: 'Full-Stack Developer', skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'], avatar: 'SR', score: 98, available: true, location: 'Buenos Aires', projects: 12, bio: 'Dev con 6 años de experiencia en startups.' },
  { id: 2, name: 'Carlos Mendoza', role: 'UI/UX Designer', skills: ['Figma', 'Framer', 'Motion Design', 'Brand'], avatar: 'CM', score: 94, available: true, location: 'Medellín', projects: 8, bio: 'Diseñador de producto enfocado en conversión.' },
  { id: 3, name: 'Valeria Torres', role: 'AI/ML Engineer', skills: ['Python', 'TensorFlow', 'LangChain', 'OpenAI'], avatar: 'VT', score: 97, available: false, location: 'Ciudad de México', projects: 15, bio: 'Especialista en LLMs y sistemas de recomendación.' },
  { id: 4, name: 'Diego Fernández', role: 'Product Manager', skills: ['Roadmapping', 'Agile', 'Notion', 'Analytics'], avatar: 'DF', score: 91, available: true, location: 'Madrid', projects: 20, bio: 'PM con foco en métricas y crecimiento.' },
  { id: 5, name: 'Luna Park', role: 'Mobile Developer', skills: ['React Native', 'Swift', 'Kotlin', 'Firebase'], avatar: 'LP', score: 95, available: true, location: 'Bogotá', projects: 9, bio: 'Mobile dev para iOS y Android.' },
  { id: 6, name: 'Andrés Vega', role: 'DevOps Engineer', skills: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform'], avatar: 'AV', score: 89, available: true, location: 'Lima', projects: 11, bio: 'Infraestructura escalable para startups.' },
]

export const MOCK_PROJECTS = [
  {
    id: 1, title: 'MediConnect', category: 'HealthTech', stage: 'MVP en desarrollo',
    description: 'Plataforma que conecta pacientes con médicos especialistas vía IA, reduciendo tiempos de espera.',
    founder: 'Martina G.', teamSize: 4, formed: true,
    team: ['Full-Stack Developer', 'UI/UX Designer', 'AI/ML Engineer', 'Product Manager'],
    raised: '$50K',
  },
  {
    id: 2, title: 'EduPath', category: 'EdTech', stage: 'Validando',
    description: 'Rutas de aprendizaje personalizadas con IA para estudiantes universitarios en Latam.',
    founder: 'Carlos R.', teamSize: 3, formed: true,
    team: ['Frontend Developer', 'AI/ML Engineer', 'Marketing & Growth'],
    raised: 'Buscando',
  },
  {
    id: 3, title: 'GreenChain', category: 'Sustentabilidad', stage: 'Idea',
    description: 'Blockchain para trazabilidad de huella de carbono en cadenas de suministro.',
    founder: 'Ana F.', teamSize: 5, formed: false,
    team: ['Blockchain Developer', 'Backend Developer', 'UI/UX Designer', 'Marketing & Growth', 'Product Manager'],
    raised: 'Buscando',
  },
]

export const TESTIMONIALS = [
  { text: 'En 48 horas tenía un equipo de 4 personas listo para arrancar. Nunca pensé que fuera tan rápido.', name: 'Martina G.', role: 'Founder @ MediConnect' },
  { text: 'Cargué mi perfil el lunes, el miércoles ya era parte de un proyecto que me apasionaba.', name: 'Juan P.', role: 'Full-Stack Developer' },
  { text: 'Como inversor, nexIA me permite ver proyectos con equipos reales ya formados. Eso cambia todo.', name: 'Roberto K.', role: 'Angel Investor' },
  { text: 'El matching de la IA es sorprendentemente preciso. Eligió exactamente el perfil que necesitaba.', name: 'Carlos R.', role: 'Founder @ EduPath' },
  { text: 'Sin entrevistas, sin procesos largos. Acepté la invitación y al día siguiente ya estábamos trabajando.', name: 'Sofía M.', role: 'UI/UX Designer' },
  { text: 'La mejor forma de encontrar co-founders y equipo técnico que encontré en Latam.', name: 'Diego F.', role: 'Emprendedor Serial' },
]
