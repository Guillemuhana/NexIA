# Manual de Usuario — Equia
> Plataforma de matching con IA para startups · Beta · Equipo Latam & EE.UU.

---

## Tabla de contenidos

1. [¿Qué es Equia?](#qué-es-equia)
2. [Registrarse y elegir un rol](#registrarse-y-elegir-un-rol)
3. [Rol: Visionario](#rol-visionario)
4. [Rol: Talento](#rol-talento)
5. [Rol: Inversor](#rol-inversor)
6. [Asistente IA integrado](#asistente-ia-integrado)
7. [Sistema de créditos y niveles](#sistema-de-créditos-y-niveles)
8. [Mensajería directa](#mensajería-directa)
9. [Precios y planes](#precios-y-planes)
10. [Preguntas frecuentes (FAQ)](#preguntas-frecuentes)

---

## ¿Qué es Equia?

Equia es una plataforma que conecta a **founders con ideas de startups** con el **talento** que necesitan para ejecutarlas, usando Inteligencia Artificial como motor de matching.

**El problema que resuelve:** encontrar el co-founder o primer equipo técnico es uno de los principales obstáculos para lanzar una startup. El proceso tradicional es lento, informal y lleno de fricción (LinkedIn, networks personales, ferias de startups). Equia lo automatiza.

**Cómo funciona (resumen):**
1. Un **Visionario** describe su idea en un chat conversacional
2. La IA analiza la idea e identifica los perfiles más compatibles de la plataforma
3. Los **Talentos** reciben invitaciones personalizadas y pueden aceptar o rechazar
4. Al aceptar, se activa un **Panel IA privado** para el equipo: roadmap, consultor, KPIs y más
5. Los **Inversores** pueden explorar proyectos con equipos ya formados

---

## Registrarse y elegir un rol

### Crear cuenta

1. Ingresá a la app y hacé clic en **"Únete gratis"**
2. Elegí tu rol (ver abajo) — es importante hacerlo antes de registrarte
3. Completá nombre, email y contraseña, **o** usá **Continuar con Google** (más rápido)
4. Si registraste por email: revisá tu correo y hacé clic en el link de verificación
5. Una vez confirmado, completá el onboarding con tus datos básicos

> **Código de invitación:** si alguien te compartió un link de referido, entrá por ese link para recibir automáticamente **+50 créditos** al registrarte. El link tiene el formato: `equia.app/registro?ref=CODIGO`.

### Los 3 roles

| Rol | Para quién | Qué puede hacer |
|-----|------------|-----------------|
| **Visionario** | Tengo una idea y quiero armar un equipo | Lanzar ideas, ver candidatos, abrir Panel IA |
| **Talento** | Soy un profesional y quiero sumarme a proyectos | Recibir invitaciones, aceptar roles, ganar equity |
| **Inversor** | Busco proyectos prometedores para invertir | Explorar proyectos con equipos formados, contactar founders |

> El rol define qué ves en el dashboard y cómo te trata el algoritmo. **No se puede cambiar después del registro** (por ahora).

---

## Rol: Visionario

### Dashboard

Al ingresar, tu dashboard muestra:
- **Asistente IA** — chat embebido para guiarte en cada paso
- **Mensajes recibidos** — mensajes directos de otros usuarios
- **Créditos y nivel** — tu posición en el ecosistema
- **Mis ideas** — tus proyectos activos con estado del equipo
- **Equity distribuido** — participaciones comprometidas con tu equipo

### Lanzar una idea

1. Hacé clic en **"+ Nueva idea"** en el dashboard o en **"Lanzar"** en el menú
2. Respondé las preguntas del chat guiado:
   - Nombre del proyecto
   - Descripción (cuanto más detalle, mejor el matching)
   - Categoría (Tech, HealthTech, EdTech, Fintech, SaaS, etc.)
   - Etapa (Idea, MVP en desarrollo, Con primeros usuarios, Buscando inversión)
   - Roles que necesitás (escribilos libremente: "dev backend, diseñador UX y alguien de marketing")
   - Visibilidad (pública para inversores, o privada)
3. Confirmá y la IA busca el equipo ideal en tiempo real
4. Ves el resultado: análisis de la idea + candidatos encontrados
5. Guardá el proyecto — se envían invitaciones automáticas a cada talento

> **Primera idea gratis.** La IA incluye: análisis de viabilidad, riesgos, tiempo estimado, tips de éxito y candidatos ordenados por compatibilidad.

### Panel IA del proyecto

Cada idea tiene su **Panel IA privado** en `/panel/:id`. Se activa al crear la idea y es accesible desde el dashboard o el menú "Mi Panel".

Dentro del panel encontrás:

| Sección | Qué hace |
|---------|----------|
| **Roadmap** | Hoja de ruta generada automáticamente por Gemini con fases, tareas y prioridades |
| **Ideas accionables** | 6 iniciativas rankeadas por impacto vs. esfuerzo |
| **KPIs y métricas** | Indicadores clave y riesgos identificados para tu modelo de negocio |
| **Consultor IA** | Chat 24/7 con contexto total del proyecto — podés preguntarle cualquier cosa |
| **Equipo** | Vista de los miembros confirmados con sus roles y equity |

### Explorar talento manualmente

En `/explorar` podés ver todos los perfiles disponibles y filtrar por:
- Nombre, rol o habilidad (búsqueda de texto)
- Rol específico (Dev Backend, Diseñador UX, Marketing, etc.)
- Solo disponibles (perfil activo en el sistema)

Desde ahí podés **invitar manualmente** a cualquier talento a tu proyecto.

### Invitar talentos

Para invitar a alguien manualmente:
1. Entrá a su perfil desde `/explorar` o su perfil público
2. Hacé clic en **"Invitar"**
3. Escribí un mensaje personalizado (opcional, hasta 400 caracteres)
4. Enviá — el talento recibe una notificación y un mensaje directo

---

## Rol: Talento

### Dashboard

Al ingresar, tu dashboard muestra:
- **Asistente IA** — chat embebido que te ayuda a completar el perfil y entender cómo funciona el algoritmo
- **Mensajes recibidos** — mensajes de founders interesados
- **Créditos y nivel** — cuánto completaste y qué tan visible sos para la IA
- **Tu espacio de equipo** — los proyectos donde aceptaste participar
- **Estado del perfil** — activo o pausado para el matching
- **Billetera de equity** — las participaciones que tenés en proyectos
- **Invitaciones** — proyectos donde la IA te seleccionó

### Completar el perfil

Ir a `/perfil` y completar:
- **Nombre** y **avatar** (foto de perfil)
- **Rol principal** (tu especialidad: Dev Backend, Diseñador UX, etc.)
- **Bio** — descripción corta de vos
- **Ubicación**
- **Portfolio URL** (tu web, GitHub, Behance, etc.)
- **LinkedIn URL**
- **Disponibilidad** — toggle para activar/desactivar el matching

> **Importante:** cada campo completo suma créditos. Más créditos = mayor prioridad en el algoritmo = más invitaciones.

### Completar el CV

Ir a `/cv` y completar todas las secciones:

| Sección | Para qué sirve |
|---------|----------------|
| **Título profesional** | Lo muestra la IA y los founders al evaluar tu perfil |
| **Resumen** | El primer texto que lee la IA para entender tu perfil |
| **Experiencia laboral** | Empresas, puestos y fechas — peso alto en el matching |
| **Educación** | Títulos, instituciones y fechas |
| **Idiomas** | Importante para proyectos internacionales |
| **Certificaciones** | Fortalecen tu perfil técnico |
| **Proyectos personales** | Con links — te diferencia de otros candidatos |

> El CV no es público para otros usuarios. Solo lo usa la IA internamente y los founders cuyo equipo ya te tiene como miembro aceptado.

**Completar el CV con el asistente IA:** en `/cv-chat` podés chatear con la IA que va extrayendo tus datos y llenando el CV automáticamente. Es más rápido que hacerlo campo por campo.

**Completar el perfil con el asistente IA:** en `/perfil-chat` la IA te hace preguntas y actualiza tu perfil automáticamente.

### Recibir y responder invitaciones

Cuando la IA te selecciona para un proyecto:
1. Aparece una notificación en tu dashboard en la sección **"Invitaciones recibidas"**
2. Ves el nombre del proyecto, la categoría, el rol que te asignaron y el razonamiento de la IA
3. Podés **Aceptar** o **Rechazar**
4. Si aceptás: se activa el Panel IA del equipo y ves a todos los demás miembros

### Equity

Si el founder te asignó equity al invitarte, aparece en tu **Billetera de equity** con:
- % de participación
- Nombre del proyecto
- Rol asignado

### Pausa y reactivación

Si en algún momento no querés recibir más invitaciones, podés **pausar tu perfil** desde el dashboard (toggle verde/gris). La IA no te incluirá en nuevos matchings hasta que lo reactives.

---

## Rol: Inversor

### Dashboard

Muestra proyectos con **equipos completamente formados** (`status: team_formed`) — los más listos para recibir inversión.

### Explorar proyectos

En `/proyectos` podés ver todos los proyectos públicos, con o sin equipo formado. Cada tarjeta muestra:
- Título y descripción
- Categoría y etapa
- Nombre del founder
- Roles del equipo

### Contactar founders

Desde el perfil público de un talento o desde la vista de proyecto, podés enviar un **mensaje directo** al founder. Funciona igual que la mensajería directa entre cualquier usuario.

---

## Asistente IA integrado

Hay **dos formas de acceder** al asistente:

### 1. Chat embebido en el Dashboard (principal)

Aparece en la parte superior del dashboard, visible desde el primer momento. Es contextual: sabe quién sos, qué tipo de usuario sos, qué proyectos tenés, qué le falta a tu perfil y qué objetivos tenés.

**Qué puede hacer:**
- Responder cualquier pregunta sobre la app o cómo usarla
- Actualizar tu perfil directamente desde el chat ("mi linkedin es https://...")
- Navegar a la sección que necesitás
- Crear una idea (si sos visionario)
- Explicarte el algoritmo de matching
- Darte feedback sobre tu perfil o idea
- Recordar conversaciones anteriores (memoria persistente)

**Sugerencias contextuales:** debajo del primer mensaje del asistente aparecen chips de preguntas sugeridas, específicas a tu situación actual.

**Collapsable:** podés minimizar el chat con el botón "Minimizar" si preferís no verlo.

### 2. Botón flotante (en todas las páginas)

El ícono de neurona naranja en la esquina inferior derecha abre un panel lateral. Funciona igual que el chat del dashboard pero disponible desde cualquier pantalla.

**Memoria persistente:** el asistente recuerda tus conversaciones anteriores. Si ya le dijiste tus objetivos, en la próxima sesión retoma desde ahí.

---

## Sistema de créditos y niveles

Los créditos son la **moneda de visibilidad** en el algoritmo. Más créditos = mayor prioridad en el matching.

### Cómo ganar créditos

| Acción | Créditos |
|--------|----------|
| Completar nombre y bio | +15 |
| Agregar ubicación | +10 |
| Agregar portfolio o LinkedIn | +15 |
| Subir avatar | +10 |
| Completar CV completo | +50 |
| Tener perfil activo (disponible) | +10 |
| Lanzar primera idea | +30 |
| Primer match aceptado | +20 |
| Referir un amigo (por cada uno, hasta 3) | +100 por referido |

### Niveles

| Nivel | Créditos | Beneficio |
|-------|----------|-----------|
| Starter | 0–149 | Acceso básico |
| Builder | 150–399 | Descuento $1/mes en planes |
| Pro | 400–749 | Descuento $2/mes en planes |
| Expert | 750+ | Descuento $3/mes en planes, máxima visibilidad |

### Programa de referidos

Cada usuario tiene un **código de referido** único visible en el dashboard. Al compartirlo:
- **Vos ganás:** +100 créditos por cada amigo que se registra (hasta 3 usos)
- **Tu amigo gana:** +50 créditos al registrarse con tu código

Podés copiar el link directo desde el bloque de referidos en el dashboard.

---

## Mensajería directa

Cualquier usuario puede enviar mensajes privados a otros usuarios desde su perfil público.

### Enviar un mensaje

1. Ingresá al perfil de alguien en `/talento/:id`
2. Hacé clic en **"✉ Mensaje"**
3. Escribí tu mensaje (máximo 1.000 caracteres)
4. Enviá — el destinatario lo recibe en su bandeja de entrada del dashboard

### Ver mensajes recibidos

1. Ingresá a tu **Dashboard**
2. Al tope de la página, expandí la sección **"✉ Mensajes"**
3. Los no leídos tienen un punto naranja y fondo levemente diferenciado
4. Hacé clic en un mensaje para marcarlo como leído; te lleva al perfil del remitente

---

## Precios y planes

| Plan | Precio | Incluye |
|------|--------|---------|
| **Gratis** | $0/mes | 1 idea con matching IA, explorar talentos, recibir invitaciones, perfil público |
| **Pro** | $11/mes | Todo lo gratis + ideas ilimitadas, matching garantizado, panel IA avanzado, prioridad en matching |
| **Expert** | $16/mes | Todo Pro + máxima visibilidad, badge Expert, soporte prioritario, estadísticas avanzadas |

Con el plan **Anual** obtenés 2 meses gratis (equivale a pagar 10 meses).

Los **créditos acumulados** descuentan automáticamente del precio mensual según tu nivel (hasta $3/mes en Expert).

> Durante la Beta, el chat directo entre usuarios está disponible para todos gratis.

---

## Preguntas frecuentes

**¿Puedo cambiar de rol?**
Por ahora no. El rol se elige al registrarse y define toda la experiencia. Si necesitás cambiarlo, contactá al equipo.

**¿Cómo funciona el matching IA?**
La IA (Claude de Anthropic) analiza la descripción de la idea, los roles requeridos y los perfiles disponibles. Considera: skills declaradas, CV, experiencia, disponibilidad y nivel de créditos. Los perfiles con más créditos aparecen primero. El resultado es una lista de candidatos ordenada por compatibilidad.

**¿Es confidencial mi idea?**
Si elegís visibilidad **Privada** al publicar, tu idea no aparece en el directorio público ni la ven los inversores. El equipo invitado sí la ve en su panel.

**¿Qué es el equity?**
Es un porcentaje de participación que el founder puede asignar a cada miembro del equipo al invitarlo. Se registra en la plataforma y es visible en la "Billetera de equity" de cada talento. La plataforma no tiene valor legal por sí sola — se recomienda formalizar con un acuerdo de co-founders.

**¿Qué pasa si nadie acepta mi invitación?**
En el plan Pro y Expert, si ningún talento acepta en 30 días, se devuelve el pago. En el plan Gratis, la idea permanece activa y se envían nuevas invitaciones cuando haya perfiles compatibles disponibles.

**¿Puedo tener más de una idea?**
El plan Gratis permite 1 idea. El plan Pro y Expert permiten ideas ilimitadas.

**¿Los créditos vencen?**
No. Los créditos son acumulativos y no tienen fecha de vencimiento.

**¿Cómo cancelo mi suscripción?**
Podés cancelar en cualquier momento. Tu plan baja a Gratis al vencimiento del período ya pago. No hay cargos por cancelación.

**¿Dónde está el soporte?**
Usá el asistente IA integrado (chat naranja, esquina inferior derecha). También podés escribir directamente al equipo por email.

**¿En qué países está disponible?**
La plataforma está en español y apunta al ecosistema emprendedor de Latinoamérica y EE.UU. No hay restricción geográfica para registrarse.

---

*© 2026 Equia · Beta · Idea: Nicolás Hercun · Diseño y desarrollo: Guillermo Muhana · Latam & EE.UU.*
