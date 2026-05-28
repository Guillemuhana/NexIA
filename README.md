# Equia — Matching de equipos para startups con IA

> **Plataforma SaaS** que conecta founders con talento usando Inteligencia Artificial.  
> Estado: **Beta cerrada** · Stack: React + Supabase + Claude API + Gemini

---

## ¿Qué es?

Equia elimina la fricción de armar el primer equipo de una startup. Un founder describe su idea en un chat conversacional, la IA analiza los perfiles disponibles y sugiere el equipo ideal en minutos. Sin entrevistas, sin procesos largos.

**Tres tipos de usuario:**
- **Visionario** — tiene una idea, la IA le arma el equipo
- **Talento** — profesional que recibe invitaciones a proyectos y puede ganar equity
- **Inversor** — explora proyectos con equipos ya formados

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite |
| Base de datos & Auth | Supabase (PostgreSQL + Google OAuth) |
| IA principal | Claude API (Anthropic) |
| IA secundaria | Gemini API (Google) |
| Deploy | Vercel |

---

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [MANUAL_USUARIO.md](./MANUAL_USUARIO.md) | Guía completa para usuarios: los 3 roles, flujos paso a paso, sistema de créditos, FAQ |
| [DOCUMENTACION_TECNICA.md](./DOCUMENTACION_TECNICA.md) | Stack, arquitectura, schema de DB, algoritmo de matching, Edge Functions, variables de entorno, deploy |

---

## Correr localmente

```bash
git clone https://github.com/Guillemuhana/NexIA.git
cd NexIA
npm install
# Crear .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

---

## Equipo

- **Idea y producto:** Nicolás Hercun
- **Diseño y desarrollo:** Guillermo Muhana

---

*© 2026 Equia · Beta · Latam & EE.UU.*
