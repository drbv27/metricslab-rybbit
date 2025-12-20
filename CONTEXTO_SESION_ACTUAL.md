# Contexto de Personalización MetricsLab - Instancia Rybbit Self-Hosted

## Resumen del Proyecto
Instancia self-hosted de Rybbit Analytics personalizada para MetricsLab, desplegada en Coolify con auto-deploy desde GitHub.

**Repositorio:** https://github.com/drbv27/metricslab-rybbit
**Dominio:** https://app.metricslab.io
**Stack:** Next.js 14 (Turpack), Fastify, PostgreSQL, ClickHouse, Docker Compose
**Deploy:** Coolify v4.0.0-beta.454 con Traefik (SSL automático)

---

## Cambios de Personalización Completados ✅

### 1. Branding y UI
- ✅ **Login Page** ([client/src/app/login/page.tsx](client/src/app/login/page.tsx))
  - Logo: Cambiado a `/metricslab.png` (300x80px)
  - Título: "MetricsLab · Login"
  - Texto de bienvenida: "Welcome to MetricsLab Analytics"
  - Botón login: Color azul `#2563eb` (bg-blue-600)
  - Layout: Centrado (sin panel lateral del globo)
  - Footer: "© 2025 MetricsLab Analytics"

- ✅ **Signup Page** ([client/src/app/signup/page.tsx](client/src/app/signup/page.tsx))
  - Título: "MetricsLab · Signup"

- ✅ **Favicon** ([client/src/app/icon.png](client/src/app/icon.png) y [client/public/faviconV2.png](client/public/faviconV2.png))
  - Icono azul de laboratorio (290 bytes PNG)

- ✅ **AppSidebar** ([client/src/components/AppSidebar.tsx](client/src/components/AppSidebar.tsx))
  - Logo colapsado: Solo favicon (24x24px)
  - Logo expandido: Favicon + texto "MetricsLab" con gradiente `from-blue-600 to-cyan-500`
  - Botón de Logout agregado (antes solo accesible en Settings)
  - Transición suave al expandir/colapsar con hover

### 2. Recursos Gráficos
Archivos en `/client/public/`:
- `metricslab.png` - Logo completo para login (estilo pixelado, texto amarillo/azul)
- `faviconV2.png` - Icono de laboratorio azul (usado como favicon y en sidebar)

---

## Problemas Resueltos Durante la Personalización

### Issue: Gateway Timeout 504 Durante Deploys
**Causa:** Cache de Docker corrupto después de múltiples intentos de deploy
**Síntomas:** Build exitoso pero aplicación inaccesible con error 504
**Solución:** Force rebuild sin cache desde Coolify UI:
1. Ir a Coolify → Aplicación
2. Click en "Advanced Deploy"
3. Marcar "No cache"
4. Deploy

**Lección aprendida:** Los cambios de UI (como el sidebar) NO causaban el problema. Era cache corrupto que se resolvió con rebuild limpio.

---

## Configuración Actual del Entorno

### Variables de Entorno Principales
```bash
# Backend
BASE_URL=https://app.metricslab.io
NEXT_PUBLIC_BACKEND_URL=https://app.metricslab.io
BETTER_AUTH_SECRET=DDTSRBn6_L07AUrbMW5Sgjoa9sk0NWpvRWuoGSRXBhc=

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=analytics
POSTGRES_USER=rybbit
CLICKHOUSE_HOST=http://clickhouse:8123
CLICKHOUSE_DB=analytics
CLICKHOUSE_USER=default

# Features
DISABLE_SIGNUP=false
NEXT_PUBLIC_CLOUD=false  # ⚠️ Importante: Esta es una instancia self-hosted
DISABLE_TELEMETRY=true
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Servicios en Docker Compose
1. **postgres** (PostgreSQL 17.4) - Metadata y autenticación
2. **clickhouse** (ClickHouse 25.4.2) - Datos de analytics
3. **backend** (Fastify + TypeScript) - API en puerto 3001
4. **frontend** (Next.js 14) - UI en puerto 3002

---

## Estructura del Código Relevante

### Client (Frontend)
```
client/
├── src/
│   ├── app/
│   │   ├── login/page.tsx          # Login personalizado
│   │   ├── signup/page.tsx         # Signup personalizado
│   │   ├── icon.png                # Favicon (Next.js convention)
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── AppSidebar.tsx          # Sidebar con logo y logout
│   │   └── AuthButton.tsx          # Botón de auth reutilizable
│   └── hooks/
│       └── useSetPageTitle.ts      # Hook para títulos de página
└── public/
    ├── metricslab.png              # Logo completo
    └── faviconV2.png               # Favicon/icono

```

### Server (Backend)
```
server/
├── src/
│   ├── index.ts                    # Entry point Fastify
│   ├── routes/                     # API endpoints
│   └── analytics-script/           # Script de tracking
└── drizzle.config.ts               # ORM config
```

---

## Estado Actual del Sistema

### ✅ Funcionando Correctamente
- Login/Signup con branding MetricsLab
- Autenticación con Better Auth
- Sidebar con logo dinámico y botón de logout
- Auto-deploy desde GitHub via Coolify
- SSL/HTTPS configurado con Traefik
- Bases de datos PostgreSQL y ClickHouse operativas

### ⚠️ Pendiente de Investigación
**IMPORTANTE:** Existen funcionalidades que están en la versión Cloud de Rybbit pero podrían estar desactivadas o no configuradas en esta instancia self-hosted:

1. **"Pages View"** - Confirmado que existe en Cloud pero no aparece en esta instancia
2. **Otras funcionalidades posiblemente desactivadas:**
   - Uptime monitoring (hay código pero comentado)
   - Google Search Console integration
   - Subscription/Billing features (solo para Cloud)
   - Telemetry (actualmente deshabilitado)
   - Admin panel (solo visible si `IS_CLOUD=true`)

**Variable clave a revisar:** `NEXT_PUBLIC_CLOUD=false` y `IS_CLOUD` en el código

---

## Próximos Pasos Sugeridos

1. **Investigar funcionalidades ocultas/desactivadas** en el código
2. **Activar "Pages View"** si existe en el código
3. **Revisar qué otras features están condicionadas por flags de Cloud vs Self-hosted**
4. **Documentar cómo activar features opcionales**

---

## Comandos Útiles

### Local Development
```bash
# Frontend
cd client && npm run dev          # Port 3002

# Backend
cd server && npm run dev          # Port 3001

# Build test
cd client && npm run build        # Verificar antes de deploy
```

### Git Workflow
```bash
git add -A
git commit -m "feat: descripción"
git push origin main              # Auto-deploy en Coolify
```

### Docker/Deployment (SSH a servidor)
```bash
# Ver logs en tiempo real
docker logs -f frontend-ikwowgooscw448c04cwckckg-[TIMESTAMP] --tail 50
docker logs -f backend-ikwowgooscw448c04cwckckg-[TIMESTAMP] --tail 50

# Ver servicios corriendo
docker ps --filter "name=ikwowgooscw448c04cwckckg"

# Entrar a PostgreSQL
docker exec -it postgres-[TIMESTAMP] psql -U rybbit -d analytics
```

---

## Notas Técnicas

### TypeScript Build
- Proyecto usa TypeScript strict mode
- Shared package (`@rybbit/shared`) debe estar built antes que client/server
- Build pipeline en Docker: `shared` → `backend` + `frontend` en paralelo

### Next.js Configuration
- App Router (Next.js 14)
- Turbopack en desarrollo
- Output: `standalone` para Docker
- Experimentos habilitados: `serverActions`

### Autenticación
- Sistema: Better Auth
- Secret en ENV: `BETTER_AUTH_SECRET`
- Signup puede ser deshabilitado con `DISABLE_SIGNUP=true`

---

## Contacto y Referencias

**Documentación Original:** Ver [CONTEXTO_PARA_CLAUDE.md](CONTEXTO_PARA_CLAUDE.md) y [INSTRUCCIONES_NUEVA_INSTANCIA.md](INSTRUCCIONES_NUEVA_INSTANCIA.md)

**Última actualización:** 2025-12-18
**Última sesión:** Personalización de branding completada, investigación de features pendientes
