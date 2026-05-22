# Equia — Manual de Usuario
**Versión Beta · 2026**

---

## ¿Qué es Equia?

Equia es una plataforma de inteligencia artificial que conecta **visionarios** (founders con ideas), **talentos** (profesionales disponibles) e **inversores** (capital buscando proyectos). La IA construye equipos, genera matches y guía a cada usuario de principio a fin.

---

## Índice

1. [Registro e ingreso](#1-registro-e-ingreso)
2. [Roles de usuario](#2-roles-de-usuario)
3. [Onboarding con IA](#3-onboarding-con-ia)
4. [Dashboard por rol](#4-dashboard-por-rol)
5. [Lanzar una idea (Visionario)](#5-lanzar-una-idea-visionario)
6. [Panel IA del proyecto](#6-panel-ia-del-proyecto)
7. [Perfil y CV con IA](#7-perfil-y-cv-con-ia)
8. [Sistema de créditos](#8-sistema-de-créditos)
9. [Sistema de referidos](#9-sistema-de-referidos)
10. [Asistente IA](#10-asistente-ia)
11. [Explorar proyectos](#11-explorar-proyectos)
12. [Preguntas frecuentes](#12-preguntas-frecuentes)

---

## 1. Registro e ingreso

### Crear cuenta nueva

1. Ir a [equia.vercel.app](https://nexia-six-iota.vercel.app) y hacer clic en **"Únete gratis"**.
2. **Elegir rol** (Visionario, Talento o Inversor).
3. Registrarse con **Google** (un clic) o con **email y contraseña**.
4. *(Opcional)* Ingresar un **código de invitación** si alguien te compartió uno — ambos reciben créditos.

### Ingresar a una cuenta existente

1. Hacer clic en **"Ingresar"** en la barra de navegación.
2. Usar Google o email + contraseña.
3. El sistema redirige automáticamente al Dashboard según el rol.

> **Nota:** Equia recuerda la sesión. En la próxima visita al sitio desde el mismo dispositivo, el ingreso es automático.

---

## 2. Roles de usuario

| Rol | Para quién | Qué puede hacer |
|---|---|---|
| **Visionario** | Founders con una idea | Lanzar proyectos, armar equipo con IA, invitar talentos |
| **Talento** | Profesionales disponibles | Recibir invitaciones a proyectos, aceptar/rechazar, armar CV con IA |
| **Inversor** | Capital buscando oportunidades | Explorar proyectos con equipos formados, contactar founders |

> El rol se elige una sola vez al registrarse y define toda la experiencia en la plataforma.

---

## 3. Onboarding con IA

Al registrarse por primera vez, Equia muestra una pantalla de bienvenida que explica el flujo según el rol. Al hacer clic en **"Configurar mi perfil con IA"**, el sistema lanza un chat guiado paso a paso:

- **Talentos y Visionarios:** el chat de perfil hace preguntas sobre experiencia, habilidades, disponibilidad y objetivos.
- Al finalizar, el perfil queda completo y listo para recibir matches o lanzar ideas.

> Si en algún momento la pantalla queda con el spinner "Configurando tu cuenta...", esperar hasta 10 segundos — el sistema tiene un timeout de seguridad.

---

## 4. Dashboard por rol

### Visionario
- **Mis ideas:** lista de proyectos lanzados con estado, equipo actual y botón al Panel IA.
- **Proyectos de la plataforma:** si aún no tiene ideas propias, puede explorar las de otros visionarios.
- **Equity distribuido:** tabla con las participaciones comprometidas al equipo.
- **Créditos y referidos:** barra de progreso de nivel y link para invitar amigos.

### Talento
- **Invitaciones recibidas:** proyectos donde la IA eligió el perfil. Cada invitación muestra el rol sugerido, el razonamiento de la IA y botones para aceptar o rechazar.
- **Espacio de equipo:** panel privado de los proyectos aceptados.
- **Estado del perfil:** indicador de disponibilidad (activo/pausado) y acceso rápido al perfil.
- **Billetera de equity:** participaciones acumuladas en proyectos aceptados.

### Inversor
- **Pipeline:** proyectos con equipos formados listos para inversión.
- Filtros por categoría, etapa y tecnología disponibles en `/explorar`.

---

## 5. Lanzar una idea (Visionario)

1. Ir a **"+ Nueva idea"** desde el Dashboard o al menú **"Lanzar"**.
2. El chat de IA guía en 6 pasos:

| Paso | Pregunta |
|---|---|
| 1 | Nombre del proyecto |
| 2 | Descripción detallada (problema + solución) |
| 3 | Categoría (Tech, HealthTech, Fintech, etc.) |
| 4 | Etapa actual (Idea, MVP, Con usuarios, Buscando inversión) |
| 5 | Roles necesarios en el equipo |
| 6 | Visibilidad (Pública o Privada) |

3. Al confirmar, la IA analiza el proyecto (**matching en ~10 segundos**):
   - Evalúa perfiles disponibles en la plataforma
   - Calcula compatibilidad de habilidades
   - Genera pitch, estimación de complejidad y tips de éxito

4. Se muestra el **equipo sugerido** con tarjetas de cada talento.
5. Al hacer clic en **"Guardar y enviar invitaciones"**, el proyecto se guarda y cada talento recibe una notificación automática.

> La primera idea es **gratuita**. Ideas adicionales requieren plan pago.

---

## 6. Panel IA del proyecto

Accesible desde el Dashboard (botón **"⚡ Panel IA →"**) o desde `/panel/:id`.

El panel incluye:
- **Consultor IA:** chat privado donde el founder puede hacer preguntas sobre su proyecto, estrategia, roadmap y equipo.
- **Estado del equipo:** miembros actuales, roles cubiertos y pendientes.
- **Acciones:** editar idea, invitar manualmente, ver perfil de talentos.

---

## 7. Perfil y CV con IA

### Perfil

Accesible desde el avatar en la barra de navegación o `/perfil`.

- **Datos básicos:** nombre, bio, ubicación, portfolio, LinkedIn.
- **Habilidades:** lista de skills que la IA usa para matching.
- **Disponibilidad:** toggle para activar/pausar el perfil (solo talentos).
- **Editar con IA:** botón que relanza el chat de perfil guiado.

> Cada campo completado suma créditos automáticamente.

### CV Digital con IA

Accesible desde `/cv-chat` o desde el menú del perfil.

El chat hace preguntas sobre:
1. Experiencia laboral
2. Formación académica
3. Habilidades técnicas y blandas
4. Idiomas
5. Certificaciones (opcional)
6. Logros y proyectos destacados

Al finalizar, la IA genera un **CV estructurado** visible en `/cv` que puede compartirse con founders e inversores.

> Completar el CV suma **+100 créditos**.

---

## 8. Sistema de créditos

Los créditos miden la actividad y completitud del perfil. Se muestran en la barra de navegación (badge **⚡**) y en el Dashboard con una barra de progreso y las acciones pendientes.

### Cómo se ganan

| Acción | Créditos |
|---|---|
| Crear cuenta | +50 |
| Completar bio (más de 20 caracteres) | +20 |
| Agregar ubicación | +10 |
| Agregar portfolio URL | +20 |
| Agregar LinkedIn | +20 |
| Completar CV con IA | +100 |
| Lanzar una idea (hasta 5) | +150 c/u |
| Agregar habilidades (hasta 5) | +10 c/u |
| Registrarse con código de invitación | +50 |
| Alguien usa tu código de invitación | +100 |

### Niveles

| Créditos | Nivel |
|---|---|
| 0 – 149 | Starter |
| 150 – 399 | Builder |
| 400 – 749 | Pro |
| 750+ | Expert |

> Los créditos se recalculan automáticamente al guardar el perfil, el CV o una idea.

---

## 9. Sistema de referidos

Cada usuario tiene un **código único de 8 caracteres** (ej: `GUILLE8X`) visible en su Dashboard.

### Cómo compartir

1. En el Dashboard, en la sección **"Invitá amigos"**, hacer clic en **"Copiar link"**.
2. Compartir el link por WhatsApp, Instagram, LinkedIn, email, etc.
3. El link tiene el formato: `equia.vercel.app/registro?ref=TUCODIGO`

### Qué pasa cuando alguien se registra con el link

- **El nuevo usuario recibe:** +50 créditos automáticamente al completar el registro.
- **Vos recibís:** +100 créditos y el contador "X personas invitadas" sube.

> El código también puede ingresarse manualmente en el campo opcional del formulario de registro.

---

## 10. Asistente IA

El botón morado **⬡** en la esquina inferior derecha abre el **Asistente Equia**.

### Capacidades

- Responder preguntas sobre la plataforma y el ecosistema
- Guiar en cualquier acción (lanzar idea, completar perfil, explorar proyectos)
- Ejecutar acciones directamente desde el chat (crear idea, actualizar perfil, navegar)
- Recordar el contexto de conversaciones anteriores (memoria persistente)

### Accesos directos

Debajo del chat aparecen chips con accesos rápidos según el rol:
- **Talentos:** Completar perfil, Ver proyectos, Mi CV, Dashboard
- **Visionarios:** Lanzar una idea, Dashboard, Explorar talento, Mi perfil
- **Inversores:** Ver proyectos, Explorar, Mi perfil

> Si el asistente no responde, cerrar y reabrir el panel. El timeout es de 25 segundos.

---

## 11. Explorar proyectos

Accesible desde `/explorar` o el menú de navegación.

- Lista de proyectos públicos con filtros por categoría y etapa.
- Cada tarjeta muestra: nombre, descripción, equipo requerido y estado.
- Al hacer clic en un proyecto se accede al detalle completo.
- **Inversores** pueden contactar al founder directamente desde la vista de detalle.

---

## 12. Preguntas frecuentes

**¿Puedo cambiar mi rol?**
No actualmente. El rol se elige una vez al registrarse y define la experiencia completa.

**¿Cuánto cuesta usar Equia?**
La primera idea (Visionario) y el perfil completo (Talento) son gratuitos. Ideas adicionales y features avanzadas tienen costo — ver `/precios`.

**¿Por qué no me llegan invitaciones?**
Verificar que el perfil esté activo (toggle verde en Dashboard), que las habilidades estén cargadas y que el CV esté completo. La IA solo invita talentos disponibles con perfil relevante.

**¿Cómo sé si alguien usó mi código de referido?**
El contador "X personas invitadas" en la sección "Invitá amigos" del Dashboard se actualiza automáticamente.

**El spinner de "Configurando tu cuenta..." no desaparece.**
Esperar hasta 10 segundos. Si persiste, cerrar sesión, volver a ingresar y completar el onboarding nuevamente.

**¿Los créditos vencen?**
No. Los créditos son acumulativos y no tienen fecha de vencimiento.

**¿Puedo ver quién me eligió para un proyecto antes de aceptar?**
Sí. En el Dashboard → Invitaciones, cada card muestra el nombre del proyecto, la categoría y el razonamiento de la IA para elegirte.

---

## Contacto y soporte

- **Reportar un problema:** [github.com/Guillemuhana/NexIA/issues](https://github.com/Guillemuhana/NexIA/issues)
- **Desarrollado por:** Guillermo Muhana
- **Idea original:** Nicolás Hercun
- **Versión:** Beta 2026 · Equipo argentino y EE.UU.

---

*Equia · Construí el equipo que tu idea merece.*
