# 🚀 Rybbit en Coolify - Inicio Rápido

Guía ultra-rápida para desplegar Rybbit Analytics en Coolify v4.

## 📝 Preparación (5 minutos)

### 1. Genera Secrets

```bash
# En tu máquina local, genera secrets seguros:
openssl rand -base64 32  # Para BETTER_AUTH_SECRET
openssl rand -base64 24  # Para POSTGRES_PASSWORD
openssl rand -base64 24  # Para CLICKHOUSE_PASSWORD
```

### 2. Configura Variables de Entorno

Copia `.env.coolify.example` y edita los valores:

```bash
BASE_URL=https://app.metricslab.io
BETTER_AUTH_SECRET=<secret-generado-1>
POSTGRES_PASSWORD=<secret-generado-2>
CLICKHOUSE_PASSWORD=<secret-generado-3>
```

---

## 🏗️ Despliegue en Coolify (20 minutos)

### Orden de Despliegue:

```
1️⃣ PostgreSQL    (Database)
2️⃣ ClickHouse    (Docker Compose)
3️⃣ Server        (Backend API)
4️⃣ Client        (Frontend)
```

---

## 1️⃣ PostgreSQL

**Coolify → Add Resource → Database → PostgreSQL**

- Name: `rybbit-postgres`
- Version: `17`
- Database: `analytics`
- User: `rybbit`
- Password: `<tu-postgres-password>`
- Memory: `512MB`

✅ **Deploy** → Espera estado "Running"

📝 **Anota el hostname interno** (ej: `rybbit-postgres`)

---

## 2️⃣ ClickHouse

**Coolify → Add Resource → Docker Compose**

Pega el contenido de [`docker-compose.coolify.yml`](./docker-compose.coolify.yml)

**Variables de entorno:**
- `CLICKHOUSE_PASSWORD=<tu-clickhouse-password>`
- `CLICKHOUSE_DB=analytics`

✅ **Deploy** → Espera estado "Running"

📝 **Anota el hostname interno** (ej: `clickhouse`)

---

## 3️⃣ Server (Backend)

**Coolify → Add Resource → Application → GitHub**

- Repository: `tu-usuario/metricslab-rybbit`
- Branch: `main`
- Build Pack: `Dockerfile`
- Dockerfile: `server/Dockerfile`
- Port: `3001`
- Memory: `512MB`

**Variables de entorno** (pega todo desde `.env.coolify`):

```env
NODE_ENV=production
BASE_URL=https://app.metricslab.io
BETTER_AUTH_SECRET=<tu-secret>

# ACTUALIZA estos hostnames con los que anotaste:
POSTGRES_HOST=rybbit-postgres
POSTGRES_PORT=5432
POSTGRES_DB=analytics
POSTGRES_USER=rybbit
POSTGRES_PASSWORD=<tu-postgres-password>

CLICKHOUSE_HOST=http://clickhouse:8123
CLICKHOUSE_DB=analytics
CLICKHOUSE_PASSWORD=<tu-clickhouse-password>

DISABLE_SIGNUP=false
DISABLE_TELEMETRY=true
```

✅ **Deploy** → Monitorea logs para ver:
```
Running database migrations...
✓ Migrations completed
Server listening on port 3001
```

---

## 4️⃣ Client (Frontend)

**Coolify → Add Resource → Application → GitHub**

- Repository: `tu-usuario/metricslab-rybbit`
- Branch: `main`
- Build Pack: `Dockerfile`
- Dockerfile: `client/Dockerfile`
- Port: `3002`
- Memory: `512MB`
- **Domain: `app.metricslab.io`** ← ¡Importante!

**Build Arguments:**

```
NEXT_PUBLIC_BACKEND_URL=https://app.metricslab.io
NEXT_PUBLIC_DISABLE_SIGNUP=false
NEXT_PUBLIC_CLOUD=false
```

**Variables de entorno:**

```env
NODE_ENV=production
NEXT_PUBLIC_BACKEND_URL=https://app.metricslab.io
NEXT_PUBLIC_DISABLE_SIGNUP=false
NEXT_PUBLIC_CLOUD=false
```

✅ **Deploy** → Espera build completado

---

## ✅ Verificación

1. Visita: `https://app.metricslab.io`
2. Deberías ver la página de login/registro ✅
3. Crea una cuenta
4. Crea tu primer sitio
5. ¡Listo! 🎉

---

## 🐛 Problemas Comunes

### Server no inicia
- ✅ Verifica que Postgres y ClickHouse estén "Running"
- ✅ Revisa hostnames en variables de entorno
- ✅ Revisa logs: `docker logs rybbit-server`

### Client muestra página en blanco
- ✅ Verifica que el build completó exitosamente
- ✅ Verifica que `NEXT_PUBLIC_BACKEND_URL` sea correcto
- ✅ Verifica que los Build Arguments se pasaron

### Errores de CORS
- ✅ Usa HTTPS, no HTTP
- ✅ Verifica que `BASE_URL` coincida con tu dominio

---

## 📚 Siguiente Paso

Lee la documentación completa: [`COOLIFY-DEPLOYMENT.md`](./COOLIFY-DEPLOYMENT.md)

---

## 🔧 Configuraciones Opcionales

Después del despliegue, puedes configurar:

- **Mapbox Token**: Visualización de globo 3D
  → https://account.mapbox.com/access-tokens/

- **Google OAuth**: Login con Google
  → https://console.cloud.google.com/apis/credentials

- **GitHub OAuth**: Login con GitHub
  → https://github.com/settings/developers

- **Resend**: Emails (invitaciones, notificaciones)
  → https://resend.com/api-keys

Solo agrega las variables de entorno al Server y redeploy.

---

**¿Necesitas ayuda?** Lee [`COOLIFY-DEPLOYMENT.md`](./COOLIFY-DEPLOYMENT.md) para una guía detallada paso a paso.
