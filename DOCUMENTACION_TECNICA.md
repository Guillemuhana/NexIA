# Documentación Técnica — Equia
> Versión beta · Stack: React + Supabase + Claude API

---

## Tabla de contenidos

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Stack tecnológico](#stack-tecnológico)
3. [Arquitectura general](#arquitectura-general)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Schema de base de datos (Supabase)](#schema-de-base-de-datos)
6. [Rutas de la aplicación](#rutas-de-la-aplicación)
7. [Sistema de autenticación](#sistema-de-autenticación)
8. [Algoritmo de matching IA](#algoritmo-de-matching-ia)
9. [Asistente IA (Claude)](#asistente-ia-claude)
10. [Edge Functions (Supabase)](#edge-functions)
11. [Sistema de créditos](#sistema-de-créditos)
12. [Sistema de equity](#sistema-de-equity)
13. [Mensajería directa](#mensajería-directa)
14. [Panel IA del proyecto (Gemini)](#panel-ia-del-proyecto)
15. [Variables de entorno](#variables-de-entorno)
16. [Correr localmente](#correr-localmente)
17. [Deploy](#deploy)
18. [Limitaciones conocidas (Beta)](#limitaciones-conocidas)
19. [Roadmap técnico](#roadmap-técnico)

---

## Resumen ejecutivo

Equia es una plataforma SaaS de matching entre founders y talento, impulsada por IA. El core del producto es un algoritmo que analiza descripciones de proyectos y perfiles de usuarios para sugerir equipos compatibles, eliminar la fricción del reclutamiento tradicional en startups early-stage.

**Usuarios objetivo:**
- Founders (Visionarios) con ideas sin equipo técnico
- Desarrolladores, diseñadores y profesionales (Talentos) que buscan proyectos
- Inversores que buscan startups con equipos formados

**Estado actual:** Beta cerrada. Sistema funcional end-to-end con IA real (no demo).

---

## Stack tecnológico

| Capa | Tecnología | Versión | Función |
|------|-----------|---------|---------|
| Frontend | React.js | 18.x | UI y estado |
| Build | Vite | 5.x | Bundler y dev server |
| Routing | React Router DOM | 6.x | SPA routing |
| Icons | Lucide React | — | Íconos SVG |
| Backend/DB | Supabase | — | PostgreSQL + Auth + Storage + Edge Functions |
| Auth | Supabase Auth | — | Email + Google OAuth |
| IA principal | Claude API (Anthropic) | claude-3-5-haiku | Matching + Asistente + Extracción de perfil |
| IA secundaria | Gemini API (Google) | gemini-1.5-flash | Roadmap + KPIs + Panel de proyecto |
| Deploy | Vercel | — | Hosting + CI/CD automático |
| Estilos | CSS-in-JS (inline) + index.css | — | Estilos globales + componentes |

> **No hay** TypeScript, no hay Redux, no hay librería de UI (Material UI, Tailwind, etc.). Todo el estilo es custom inline + clases globales en `index.css`.

---

## Arquitectura general

```
Usuario (Browser)
       │
       ▼
   Vercel CDN
   (React SPA)
       │
       ├──► Supabase Auth (Google OAuth / Email)
       │
       ├──► Supabase Database (PostgreSQL)
       │         └── Row Level Security activado
       │
       ├──► Supabase Storage (avatares)
       │
       └──► Supabase Edge Functions
                  └── claude-proxy (Deno)
                           ├── Claude API (Anthropic)
                           └── Gemini API (Google)
```

**Patrón de comunicación IA:**
Todo acceso a Claude y Gemini pasa por la Edge Function `claude-proxy`. El frontend nunca llama directo a las APIs de IA — las API keys están server-side en la Edge Function.

**No hay backend propio.** Toda la lógica de negocio vive en:
- Supabase RLS (Row Level Security) para autorización
- Supabase Database Functions / RPCs para operaciones atómicas
- Edge Function `claude-proxy` para IA

---

## Estructura del proyecto

```
nexia/
├── public/
│   └── IMG03HERO.png          # Imagen hero de la landing
├── src/
│   ├── App.jsx                # Routing principal + Footer
│   ├── main.jsx               # Entry point React
│   ├── index.css              # Estilos globales + keyframes
│   │
│   ├── context/
│   │   └── AuthContext.jsx    # Estado global de auth y perfil
│   │
│   ├── lib/
│   │   ├── supabase.js        # Cliente Supabase
│   │   ├── claude.js          # Helpers para invocar Edge Function
│   │   ├── gemini.js          # Helpers para Gemini vía Edge Function
│   │   └── constants.js       # Roles, niveles de crédito, acciones, categorías
│   │
│   ├── components/
│   │   ├── AssistantWidget.jsx  # Chat IA flotante (todas las páginas)
│   │   ├── DashboardChat.jsx    # Chat IA embebido en el Dashboard
│   │   ├── ChatWidget.jsx       # Mensajería directa entre usuarios
│   │   ├── Navbar.jsx           # Barra de navegación superior
│   │   ├── ProjectCard.jsx      # Card de proyecto
│   │   ├── TalentCard.jsx       # Card de talento
│   │   ├── PaywallModal.jsx     # Modal de confirmación de pago
│   │   └── LogoEquia.jsx        # Logo animado
│   │
│   └── pages/
│       ├── Home.jsx             # Landing page pública
│       ├── Dashboard.jsx        # Dashboard autenticado (3 tipos)
│       ├── Login.jsx            # Login email + Google
│       ├── Registro.jsx         # Registro con rol + referido
│       ├── AuthCallback.jsx     # Callback de OAuth
│       ├── Onboarding.jsx       # Selección de rol post-registro
│       ├── LanzarIdea.jsx       # Flujo de creación de idea (chat + matching)
│       ├── Explorar.jsx         # Directorio de talentos con filtros
│       ├── Proyectos.jsx        # Listado de proyectos públicos
│       ├── ProyectoDetalle.jsx  # Detalle de un proyecto
│       ├── ProyectoPanel.jsx    # Panel IA privado del equipo
│       ├── Perfil.jsx           # Editor de perfil
│       ├── PerfilPublico.jsx    # Vista pública de un talento
│       ├── ProfileChat.jsx      # Chat IA para completar perfil
│       ├── CV.jsx               # Editor de CV
│       ├── CVChat.jsx           # Chat IA para completar CV
│       ├── Precios.jsx          # Página de precios
│       ├── Admin.jsx            # Panel de admin
│       └── FAQ.jsx              # Preguntas frecuentes
├── MANUAL_USUARIO.md
├── DOCUMENTACION_TECNICA.md
├── package.json
└── vite.config.js
```

---

## Schema de base de datos

### Tabla: `users`
Perfil principal de cada usuario (mapeado 1:1 con `auth.users`).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | Mismo ID que `auth.users` |
| `name` | text | Nombre completo |
| `email` | text | Email |
| `avatar_url` | text | URL de avatar (Supabase Storage) |
| `bio` | text | Descripción del usuario |
| `location` | text | Ciudad/País |
| `portfolio_url` | text | URL de portfolio |
| `linkedin_url` | text | URL de LinkedIn |
| `cv_data` | jsonb | CV completo (ver estructura abajo) |
| `credits` | int | Créditos acumulados |
| `referral_code` | text | Código único de referido |
| `referral_count` | int | Cuántas veces fue usado (máx 3) |
| `created_at` | timestamptz | — |

**Estructura de `cv_data` (JSONB):**
```json
{
  "job_title": "Full-Stack Developer",
  "summary": "...",
  "experience": [
    { "company": "...", "role": "...", "start": "2022", "end": "2024", "description": "..." }
  ],
  "education": [
    { "institution": "...", "degree": "...", "start": "2018", "end": "2022" }
  ],
  "languages": [
    { "language": "Español", "level": "Nativo" }
  ],
  "certifications": [
    { "name": "...", "org": "...", "year": "2023" }
  ],
  "projects": [
    { "name": "...", "description": "...", "url": "..." }
  ]
}
```

---

### Tabla: `user_roles`
Asignación de rol a cada usuario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | — |
| `user_id` | uuid (FK → users) | — |
| `role_type` | text | `'visionario'` \| `'talento'` \| `'inversor'` |
| `is_primary` | boolean | Si es el rol principal |
| `created_at` | timestamptz | — |

---

### Tabla: `talent_profiles`
Información adicional para usuarios de tipo talento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | — |
| `user_id` | uuid (FK → users, UNIQUE) | — |
| `available` | boolean | Si el talento acepta invitaciones |
| `main_role` | text | Rol principal (Dev Backend, Diseñador UX, etc.) |
| `match_score_avg` | float | Score promedio de matching asignado por la IA |
| `projects_count` | int | Cantidad de proyectos en los que participó |

---

### Tabla: `ideas`
Proyectos/ideas creados por visionarios.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | — |
| `founder_id` | uuid (FK → users) | — |
| `title` | text | Nombre del proyecto |
| `description` | text | Descripción completa |
| `category` | text | Tech, HealthTech, SaaS, etc. |
| `stage` | text | Etapa del proyecto |
| `status` | text | `'open'` \| `'team_formed'` |
| `is_public` | boolean | Visible en el directorio público |
| `ai_analysis` | jsonb | Análisis de la IA al crear la idea |
| `created_at` | timestamptz | — |

**Estructura de `ai_analysis` (JSONB):**
```json
{
  "pitch": "...",
  "whyThisTeam": "...",
  "teamSize": 4,
  "complexity": "Media",
  "timeEstimate": "4 meses",
  "successTip": "...",
  "risks": "...",
  "rolesNeeded": ["Dev Backend", "Diseñador UX"]
}
```

---

### Tabla: `idea_roles`
Roles requeridos para cada idea.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | — |
| `idea_id` | uuid (FK → ideas) | — |
| `role_name` | text | Nombre del rol |
| `filled` | boolean | Si el rol fue cubierto por un talento |

---

### Tabla: `matches`
Relación entre idea y talento (la invitación/match).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | — |
| `idea_id` | uuid (FK → ideas) | — |
| `talent_id` | uuid (FK → users) | — |
| `role_suggested` | text | Rol para el que fue seleccionado |
| `score` | int | Score de compatibilidad (0–100) |
| `ai_reasoning` | text | Explicación de la IA |
| `status` | text | `'pending'` \| `'invited'` \| `'accepted'` \| `'rejected'` |
| `equity_pct` | float | % de equity asignado (opcional) |
| `created_at` | timestamptz | — |

---

### Tabla: `direct_messages`
Mensajes directos entre usuarios.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | — |
| `sender_id` | uuid (FK → users) | — |
| `receiver_id` | uuid (FK → users) | — |
| `content` | text | Contenido del mensaje |
| `read` | boolean | Si fue leído |
| `created_at` | timestamptz | — |

---

### Tabla: `assistant_messages`
Historial del chat con el asistente IA (DashboardChat + AssistantWidget).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | — |
| `user_id` | uuid (FK → users) | — |
| `role` | text | `'user'` \| `'ai'` |
| `text` | text | Contenido del mensaje |
| `created_at` | timestamptz | — |

---

### Tabla: `user_memory`
Memoria persistente del asistente IA por usuario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | — |
| `user_id` | uuid (FK → users, UNIQUE) | — |
| `summary` | text | Resumen de la persona y sus objetivos |
| `goals` | text[] | Lista de objetivos detectados |
| `key_facts` | text[] | Datos clave recordados |
| `style` | jsonb | Estilo de comunicación detectado |
| `conversation_count` | int | Cuántas conversaciones hubo |
| `last_updated` | timestamptz | — |

---

### Tabla: `skills`
Catálogo de skills disponibles.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | — |
| `name` | text (UNIQUE) | Nombre de la skill |

---

### Tabla: `user_skills`
Relación muchos-a-muchos entre usuarios y skills.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `user_id` | uuid (FK → users) | — |
| `skill_id` | uuid (FK → skills) | — |

---

### Tabla: `notifications`
Notificaciones del sistema para cada usuario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | — |
| `user_id` | uuid (FK → users) | Destinatario |
| `type` | text | `'match_received'` \| otros |
| `title` | text | Título de la notificación |
| `body` | text | Cuerpo |
| `link` | text | URL de destino |
| `data` | jsonb | Datos adicionales |
| `read` | boolean | — |
| `created_at` | timestamptz | — |

---

### RPCs (Database Functions)

| Función | Descripción |
|---------|-------------|
| `assign_user_role(p_role_type)` | Asigna el rol principal a un usuario |
| `apply_referral_code(p_new_user_id, p_ref_code)` | Aplica un código de referido y distribuye créditos |
| `invite_talent(p_idea_id, p_talent_id, p_role, p_message)` | Crea un match + envía mensaje directo + notificación |
| `recalculate_user_credits(p_user_id)` | Recalcula créditos según estado del perfil y acciones |

---

## Rutas de la aplicación

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/` | `Home.jsx` | Público |
| `/registro` | `Registro.jsx` | Público |
| `/login` | `Login.jsx` | Público |
| `/auth/callback` | `AuthCallback.jsx` | OAuth redirect |
| `/onboarding` | `Onboarding.jsx` | Autenticado sin rol |
| `/dashboard` | `Dashboard.jsx` | Autenticado |
| `/lanzar` | `LanzarIdea.jsx` | Autenticado (visionario) |
| `/explorar` | `Explorar.jsx` | Público (invite solo visionario) |
| `/proyectos` | `Proyectos.jsx` | Público |
| `/proyectos/:id` | `ProyectoDetalle.jsx` | Público |
| `/panel/:id` | `ProyectoPanel.jsx` | Autenticado (equipo del proyecto) |
| `/perfil` | `Perfil.jsx` | Autenticado |
| `/talento/:id` | `PerfilPublico.jsx` | Público |
| `/perfil-chat` | `ProfileChat.jsx` | Autenticado |
| `/cv` | `CV.jsx` | Autenticado |
| `/cv-chat` | `CVChat.jsx` | Autenticado |
| `/precios` | `Precios.jsx` | Público |
| `/faq` | `FAQ.jsx` | Público |
| `/admin` | `Admin.jsx` | Admin only |

---

## Sistema de autenticación

**Flujo email:**
1. Usuario completa nombre, email, password en `/registro`
2. Se llama a `supabase.auth.signUp()`
3. Supabase envía email de verificación
4. Al confirmar, `onAuthStateChange` dispara con evento `SIGNED_IN`
5. Se crea el registro en `public.users` si no existe
6. Se aplica el rol pendiente desde `localStorage.nexia_pending_role`
7. Se aplica el código de referido si hay uno

**Flujo Google OAuth:**
1. Usuario hace clic en "Continuar con Google"
2. Se llama a `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. Redirect a Google, después vuelve a `/auth/callback`
4. `AuthCallback.jsx` espera a que `onAuthStateChange` confirme la sesión
5. Resto igual al flujo email (rol + referido desde localStorage)

**Estado global:** `AuthContext.jsx` maneja `user`, `profile`, `loading` y `profileFetched`.
- `loading`: true mientras Supabase resuelve la sesión inicial
- `profileFetched`: true cuando el perfil fue cargado de la DB (evita flashes en Dashboard)
- Safety timeout de 8 segundos por si la DB no responde

---

## Algoritmo de matching IA

### Flujo completo

```
1. Visionario completa el chat de lanzamiento en /lanzar
      │
      ▼
2. Frontend llama a Edge Function claude-proxy con action: 'matchTeam'
      │
      ▼
3. Claude analiza la idea (título, descripción, categoría, roles)
   y devuelve un JSON con:
   - pitch, whyThisTeam, teamSize, complexity
   - timeEstimate, successTip, risks
   - rolesNeeded: ["Dev Backend", "Diseñador UX", ...]
      │
      ▼
4. Frontend consulta Supabase: talent_profiles WHERE available=true
   AND main_role IN (rolesNeeded) LIMIT 6
   + JOIN users (nombre, avatar, bio, créditos)
   + JOIN user_skills (skills del usuario)
      │
      ▼
5. Candidatos ordenados por créditos (más créditos = más visible)
      │
      ▼
6. Se muestran los candidatos al visionario
      │
      ▼
7. Al guardar: INSERT INTO ideas + idea_roles + matches (status='invited')
   + INSERT INTO notifications para cada talento
```

### Scoring

El `score` en la tabla `matches` es un número simple (actualmente 75 como base). La prioridad real la da la columna `credits` del usuario al ordenar los resultados. El `match_score_avg` en `talent_profiles` es un promedio que se puede actualizar externamente.

---

## Asistente IA (Claude)

### Componentes

| Componente | Dónde | Qué hace |
|-----------|-------|----------|
| `DashboardChat.jsx` | Dashboard (inline) | Chat principal, visible de entrada |
| `AssistantWidget.jsx` | Toda la app (flotante) | Acceso rápido desde cualquier página |

Ambos comparten la misma lógica: mismas tablas (`assistant_messages`, `user_memory`), misma Edge Function (`claude-proxy` action: `assistantChat`).

### Context enviado a Claude en cada mensaje

```json
{
  "name": "Guillermo",
  "type": "visionario",
  "role": "...",
  "bio": "...",
  "skills": ["React", "Node.js"],
  "location": "Buenos Aires",
  "available": true,
  "ideas": [{ "title": "Mi Idea", "status": "open" }],
  "credits": 150,
  "profilePct": 75,
  "cvData": { ... },
  "memory": {
    "summary": "...",
    "goals": ["lanzar startup HealthTech"],
    "key_facts": [...],
    "style": {}
  }
}
```

### Acciones inline (parseo de JSON en respuesta)

El asistente puede insertar acciones en su respuesta con la sintaxis:
```
[EJECUTAR:{"type":"navigate","data":{"to":"/lanzar"}}]
[EJECUTAR:{"type":"update_profile","data":{"linkedin_url":"https://..."}}]
[EJECUTAR:{"type":"create_idea","data":{"title":"...","description":"...","category":"...","roles":[]}}]
```

El frontend parsea estas acciones con regex y las ejecuta sin confirmación (navegar) o con confirmación modal (crear idea, actualizar perfil).

### Memoria persistente

Cada 6 mensajes nuevos, se llama a `claude-proxy` con action: `updateMemory` para actualizar el resumen, goals y key_facts del usuario en `user_memory`. La próxima vez que el usuario abra el chat, el asistente saluda con contexto del historial.

---

## Edge Functions

### `claude-proxy` (Deno, Supabase Edge Functions)

Punto de entrada único para todas las llamadas de IA.

**Actions implementadas:**

| Action | IA | Descripción |
|--------|----|-------------|
| `assistantChat` | Claude | Chat general del asistente |
| `updateMemory` | Claude | Actualiza memoria persistente del usuario |
| `matchTeam` | Claude | Analiza una idea y sugiere roles/candidatos |
| `generateInvitationMessage` | Claude | Genera mensaje personalizado de invitación |
| `extractProfile` | Claude | Extrae datos de perfil de una conversación |
| `chatProfile` | Claude | Genera siguiente pregunta del chat de perfil |
| `roadmap` | Gemini | Genera roadmap para ProyectoPanel |
| `ideas` | Gemini | Genera ideas accionables para ProyectoPanel |
| `kpis` | Gemini | Genera KPIs y métricas para ProyectoPanel |
| `consultorChat` | Gemini | Chat del consultor IA en ProyectoPanel |

**Timeout del frontend:** 40 segundos. Si la Edge Function no responde, se muestra un mensaje de error friendly.

---

## Sistema de créditos

Los créditos se calculan con la RPC `recalculate_user_credits` que evalúa:

```sql
-- Pseudocódigo de la lógica
credits = 0
if name != null        then credits += 15
if bio != null         then credits += 15
if location != null    then credits += 10
if portfolio or linkedin then credits += 15
if avatar_url != null  then credits += 10
if cv_data completeness >= 80% then credits += 50
if talent_profile.available then credits += 10
if has_idea            then credits += 30
if has_accepted_match  then credits += 20
for each referral (max 3): credits += 100
```

La función se llama tras cada acción relevante (actualizar perfil, aceptar un match, etc.) y el resultado actualiza `users.credits`.

**Niveles:**

| Nivel | Rango | Badge en navbar |
|-------|-------|----------------|
| Starter | 0–149 | — |
| Builder | 150–399 | ⚡ + número |
| Pro | 400–749 | ⚡ + número |
| Expert | 750+ | ⚡ + número |

---

## Sistema de equity

El equity se registra en la columna `matches.equity_pct`. El founder puede especificarlo al invitar a un talento.

- No tiene impacto directo en el sistema (es un acuerdo simbólico)
- Se muestra en la "Billetera de equity" del talento y en el dashboard del founder
- Se recomienda formalizar por fuera de la plataforma con un acuerdo de co-founders

---

## Mensajería directa

Tabla: `direct_messages`

**Flujo de envío:** `PerfilPublico.jsx` → INSERT en `direct_messages`

**Flujo de recepción:** `Dashboard.jsx` componente `DirectInbox` → SELECT de mensajes recibidos + JOIN a `users` para datos del remitente

**Real-time:** `ChatWidget.jsx` usa `supabase.channel()` con `on('postgres_changes', ...)` para mensajes en tiempo real en la ventana de chat.

---

## Panel IA del proyecto

`ProyectoPanel.jsx` — accesible en `/panel/:id`

### Control de acceso

Solo pueden acceder:
- El founder (creator de la idea)
- Los talentos con `match.status = 'accepted'` para esa idea

### Secciones y sus llamadas de IA

| Sección | Action en Edge Function | IA |
|---------|------------------------|-----|
| Roadmap | `roadmap` | Gemini |
| Ideas accionables | `ideas` | Gemini |
| KPIs y métricas | `kpis` | Gemini |
| Consultor chat | `consultorChat` | Gemini |

Cada sección se carga on-demand (al expandir) con su propio estado de loading y caché local en el componente.

---

## Variables de entorno

### Frontend (`vite.config.js` / `.env`)
```env
VITE_SUPABASE_URL=https://xibgetxijmdgfkojuyzx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Edge Function (`claude-proxy`) — secrets en Supabase Dashboard
```env
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

> Las API keys de IA nunca están en el frontend. Solo en los secrets de la Edge Function.

---

## Correr localmente

```bash
# 1. Clonar el repo
git clone https://github.com/Guillemuhana/NexIA.git
cd NexIA

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env.local con las variables de entorno
# (copiar del .env.example o pedirlas al equipo)

# 4. Correr el servidor de desarrollo
npm run dev
# → http://localhost:5173
```

**Nota:** la app usa Supabase en producción. Para desarrollo local apunta al mismo proyecto de Supabase (shared environment). No hay setup local de DB necesario.

---

## Deploy

**Plataforma:** Vercel

**CI/CD:** cada push a `main` dispara un deploy automático en Vercel.

```bash
# Deploy manual (si es necesario)
vercel --prod
```

**Edge Functions:** las Edge Functions de Supabase se despliegan desde el dashboard de Supabase o con la CLI:
```bash
supabase functions deploy claude-proxy
```

---

## Limitaciones conocidas (Beta)

| Limitación | Impacto | Estado |
|-----------|---------|--------|
| Pagos simulados | El PaywallModal espera 1.2s y aprueba sin cobro real | Pendiente integrar Stripe |
| Un solo rol por usuario | No se puede ser visionario y talento simultáneamente | Roadmap |
| Sin notificaciones push | Las notificaciones son solo in-app (tabla `notifications`) | Roadmap |
| Sin búsqueda de proyectos por texto | `/proyectos` solo filtra por categoría/etapa | Roadmap |
| `idea_id` en perfil = solo el último | `profile.idea_id` guarda solo la idea más reciente del visionario | Bug menor |
| Sin términos y privacidad formales | Los links de T&C redirigen a /faq | Roadmap legal |
| Edge Function timeout | Respuestas de IA pueden tardar hasta 40s | Optimización pendiente |

---

## Roadmap técnico

**Corto plazo (pre-lanzamiento):**
- [ ] Integrar Stripe para pagos reales (Pro/Expert)
- [ ] Push notifications (Supabase Realtime o FCM)
- [ ] Términos de uso y política de privacidad formales
- [ ] Optimizar bundles (code splitting por ruta)

**Mediano plazo:**
- [ ] Roles múltiples por usuario (visionario + talento)
- [ ] Búsqueda semántica de proyectos con embeddings
- [ ] API pública para integrations
- [ ] Internacionalización (i18n) — inglés como segundo idioma

**Largo plazo:**
- [ ] App móvil (React Native)
- [ ] Formalización de equity (firma digital)
- [ ] Integración con LinkedIn para importar CV
- [ ] Marketplace de proyectos con métricas de tracción

---

*© 2026 Equia · Idea: Nicolás Hercun · Diseño y desarrollo: Guillermo Muhana · Latam & EE.UU.*
