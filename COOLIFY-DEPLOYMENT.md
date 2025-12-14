# Rybbit Analytics - Despliegue en Coolify v4

Esta guía te ayudará a desplegar Rybbit Analytics en Coolify v4 con servicios separados para máxima flexibilidad y escalabilidad.

## 📋 Requisitos Previos

- ✅ VPS con al menos 4GB RAM, 2 vCPU, 50GB disco
- ✅ Coolify v4 instalado y funcionando
- ✅ Dominio configurado (ej: `app.metricslab.io`)
- ✅ Repositorio GitHub con el código de Rybbit

## 🏗️ Arquitectura de Despliegue

Desplegaremos 4 servicios separados en Coolify:

```
┌─────────────────────────────────────────┐
│          app.metricslab.io              │
│              (HTTPS/443)                │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ┌───▼────┐      ┌────▼────┐
    │ Client │      │ Server  │
    │ (3002) │      │ (3001)  │
    └────────┘      └─┬──┬────┘
                      │  │
              ┌───────┘  └────────┐
              │                   │
        ┌─────▼──────┐    ┌──────▼─────┐
        │ PostgreSQL │    │ ClickHouse │
        │   (5432)   │    │   (8123)   │
        └────────────┘    └────────────┘
```

### Distribución de Recursos (4GB RAM total)

- **PostgreSQL**: ~512MB
- **ClickHouse**: ~1.5GB (base de datos analítica, consume más)
- **Server (Backend)**: ~512MB
- **Client (Frontend)**: ~512MB
- **Sistema Operativo**: ~1GB

## 🚀 Guía de Despliegue Paso a Paso

### FASE 1: Preparar Variables de Entorno

1. **Copia el archivo de ejemplo**:
   ```bash
   cp .env.coolify.example .env.coolify
   ```

2. **Edita `.env.coolify` y configura los valores OBLIGATORIOS**:

   **🔐 SEGURIDAD (CRÍTICO)**:
   ```bash
   # Genera secrets seguros con:
   openssl rand -base64 32

   # Configura:
   BETTER_AUTH_SECRET=tu-secret-aqui-minimo-32-caracteres
   CLICKHOUSE_PASSWORD=password-seguro-clickhouse
   POSTGRES_PASSWORD=password-seguro-postgres
   ```

   **🌐 DOMINIO**:
   ```env
   BASE_URL=https://app.metricslab.io
   NEXT_PUBLIC_BACKEND_URL=https://app.metricslab.io
   ```

3. **Configura servicios opcionales** (puedes hacerlo después):
   - Mapbox Token (para visualización de globo 3D)
   - Google/GitHub OAuth (para login social)
   - Resend API Key (para emails)

### FASE 2: Desplegar PostgreSQL en Coolify

**PANTALLA POR PANTALLA - TE GUIARÉ**

1. En Coolify, ve a tu proyecto → **"+ Add Resource"**
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Configura:
   - **Name**: `rybbit-postgres` (o como prefieras)
   - **Version**: `17` o `17.4` (la más reciente)
   - **Database Name**: `analytics`
   - **Username**: `rybbit`
   - **Password**: El que pusiste en `POSTGRES_PASSWORD`
   - **Port**: `5432` (interno)
   - **Memory Limit**: `512MB`

4. **NO expongas públicamente** (sin dominio público)
5. Click **"Deploy"**
6. **ESPERA** hasta que el estado sea "Running" ✅

**📝 ANOTA**: El **hostname interno** que Coolify asigna (generalmente es el nombre del servicio)

---

### FASE 3: Desplegar ClickHouse en Coolify

**ClickHouse requiere configuración especial**

#### Opción A: Usar Docker Compose (Recomendado para ClickHouse)

1. En Coolify, ve a **"+ Add Resource"** → **"Docker Compose"**
2. Usa este `docker-compose.yml`:

```yaml
services:
  clickhouse:
    image: clickhouse/clickhouse-server:25.4.2
    container_name: clickhouse
    environment:
      CLICKHOUSE_DB: analytics
      CLICKHOUSE_USER: default
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}
    volumes:
      - clickhouse-data:/var/lib/clickhouse
      - ./clickhouse-config.xml:/etc/clickhouse-server/config.d/network.xml:ro
      - ./clickhouse-json.xml:/etc/clickhouse-server/config.d/enable_json.xml:ro
      - ./clickhouse-logging.xml:/etc/clickhouse-server/config.d/logging_rules.xml:ro
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8123/ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1536M
        reservations:
          memory: 1024M

volumes:
  clickhouse-data:
```

3. **Configura las variables de entorno** en Coolify:
   - `CLICKHOUSE_PASSWORD`: El que configuraste antes

4. **Crea los archivos de configuración** (te los daré después)

5. Click **"Deploy"**

#### Opción B: ClickHouse como servicio individual

1. En Coolify, ve a **"+ Add Resource"** → **"Service"** → **"Docker Image"**
2. Configura:
   - **Image**: `clickhouse/clickhouse-server:25.4.2`
   - **Name**: `rybbit-clickhouse`
   - **Port interno**: `8123`
   - **Memory Limit**: `1536MB`

3. **Variables de entorno**:
   ```
   CLICKHOUSE_DB=analytics
   CLICKHOUSE_USER=default
   CLICKHOUSE_PASSWORD=tu-password-aqui
   ```

4. **Volúmenes persistentes**:
   - `/var/lib/clickhouse` → Volumen persistente

5. Click **"Deploy"**

**📝 ANOTA**: El **hostname interno** de ClickHouse

---

### FASE 4: Desplegar Server (Backend)

1. En Coolify, ve a **"+ Add Resource"** → **"Application"**
2. Selecciona **"GitHub"** → Conecta tu repositorio `metricslab-rybbit`
3. Configura:
   - **Name**: `rybbit-server`
   - **Branch**: `main`
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `server/Dockerfile`
   - **Base Directory**: `/` (root del repo)
   - **Port**: `3001`
   - **Memory Limit**: `512MB`

4. **Variables de entorno** (pega TODO el contenido de `.env.coolify`):
   - Ve a la pestaña **"Environment Variables"**
   - Pega todas las variables
   - **IMPORTANTE**: Actualiza los hostnames:
     ```
     CLICKHOUSE_HOST=http://[nombre-servicio-clickhouse]:8123
     POSTGRES_HOST=[nombre-servicio-postgres]
     ```

5. **Build Arguments** (en Advanced):
   - No se necesitan build args para el server

6. **Health Check** (opcional pero recomendado):
   - Path: `/api/health`
   - Port: `3001`

7. Click **"Deploy"**

8. **Monitorea los logs** - Deberías ver:
   ```
   Running database migrations...
   ✓ Migrations completed
   Starting application...
   Server listening on port 3001
   ```

---

### FASE 5: Desplegar Client (Frontend)

1. En Coolify, ve a **"+ Add Resource"** → **"Application"**
2. Selecciona **"GitHub"** → Mismo repositorio `metricslab-rybbit`
3. Configura:
   - **Name**: `rybbit-client`
   - **Branch**: `main`
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `client/Dockerfile`
   - **Base Directory**: `/` (root del repo)
   - **Port**: `3002`
   - **Memory Limit**: `512MB`
   - **Dominio**: `app.metricslab.io` ← **ASIGNA TU DOMINIO AQUÍ**

4. **Build Arguments** (CRÍTICO para Next.js):
   - `NEXT_PUBLIC_BACKEND_URL=https://app.metricslab.io`
   - `NEXT_PUBLIC_DISABLE_SIGNUP=false`
   - `NEXT_PUBLIC_CLOUD=false`

5. **Variables de entorno**:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_BACKEND_URL=https://app.metricslab.io
   NEXT_PUBLIC_DISABLE_SIGNUP=false
   NEXT_PUBLIC_CLOUD=false
   ```

6. **Configuración de red**:
   - Coolify debe configurar automáticamente SSL (Let's Encrypt)
   - Asegúrate de que el dominio apunte a tu servidor

7. Click **"Deploy"**

---

### FASE 6: Configurar Routing Interno (Importante)

**El Client necesita comunicarse con el Server**

En Coolify, asegúrate de que:

1. **Todos los servicios estén en la misma red Docker** (Coolify lo hace por defecto)
2. **El Server sea accesible desde el Client** mediante el hostname interno
3. **El dominio principal apunte al Client** (puerto 3002)

**Configuración de proxy reverso**:

El Client hace peticiones a `/api/*` que deben ir al Server. Tienes dos opciones:

#### Opción A: El Client hace proxy interno (recomendado)

El Dockerfile del client ya está configurado para esto. No requiere cambios.

#### Opción B: Configurar Coolify para rutear `/api/*` al Server

1. En el servicio **Client**, ve a **"Networks"** o **"Proxy"**
2. Agrega una regla de proxy:
   - Path: `/api/*` → Proxy a `rybbit-server:3001`

---

### FASE 7: Verificación y Testing

1. **Accede a tu dominio**: `https://app.metricslab.io`

2. **Deberías ver la página de login/registro de Rybbit** ✅

3. **Crea tu primera cuenta**:
   - Click en "Sign Up"
   - Ingresa email y password
   - Crea tu organización

4. **Crea tu primer sitio**:
   - Dashboard → "Add Site"
   - Ingresa el dominio a trackear
   - Copia el tracking script

5. **Verifica que el tracking funcione**:
   - Instala el script en un sitio web de prueba
   - Visita el sitio
   - Regresa a Rybbit dashboard
   - Deberías ver el pageview en tiempo real ✅

---

## 🔧 Archivos de Configuración de ClickHouse

Crea estos archivos en tu repositorio en `/clickhouse-configs/`:

### `clickhouse-config.xml` (network config)
```xml
<clickhouse>
    <listen_host>0.0.0.0</listen_host>
</clickhouse>
```

### `clickhouse-json.xml` (enable JSON type)
```xml
<clickhouse>
    <settings>
        <enable_json_type>1</enable_json_type>
    </settings>
</clickhouse>
```

### `clickhouse-logging.xml` (reduce logs)
```xml
<clickhouse>
  <logger>
      <level>warning</level>
      <console>true</console>
  </logger>
  <query_thread_log remove="remove"/>
  <query_log remove="remove"/>
  <text_log remove="remove"/>
  <trace_log remove="remove"/>
  <metric_log remove="remove"/>
  <asynchronous_metric_log remove="remove"/>
  <session_log remove="remove"/>
  <part_log remove="remove"/>
</clickhouse>
```

---

## 🐛 Troubleshooting

### El Server no inicia

**Síntoma**: Logs muestran errores de conexión a DB

**Solución**:
1. Verifica que PostgreSQL y ClickHouse estén "Running"
2. Verifica los hostnames en las variables de entorno
3. Verifica las passwords
4. Revisa los logs de cada servicio

### El Client no carga

**Síntoma**: Página en blanco o error 502

**Solución**:
1. Verifica que el build de Next.js completó exitosamente
2. Revisa los logs del client: `docker logs rybbit-client`
3. Verifica que `NEXT_PUBLIC_BACKEND_URL` esté correcto
4. Asegúrate de que los build args se pasaron correctamente

### Errores de CORS

**Síntoma**: Errores en la consola del navegador sobre CORS

**Solución**:
1. Verifica que `BASE_URL` coincida con tu dominio real
2. Asegúrate de estar usando HTTPS (no HTTP)
3. Verifica que el Server tenga la variable `BASE_URL` correcta

### Migraciones de DB fallan

**Síntoma**: Server se reinicia constantemente, logs muestran errores de Drizzle

**Solución**:
1. Conecta manualmente a PostgreSQL y verifica que la DB exista
2. Verifica las credenciales de PostgreSQL
3. Asegúrate de que el Server pueda alcanzar PostgreSQL en la red interna

### ClickHouse consume mucha RAM

**Síntoma**: El VPS se queda sin memoria, OOM killer mata procesos

**Solución**:
1. Edita el docker-compose de ClickHouse y reduce la memoria:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 1024M  # Reduce de 1536M a 1024M
   ```
2. Considera usar un VPS más grande (6GB+ RAM recomendado para producción)

---

## 📊 Monitoreo de Recursos

**Comandos útiles en el servidor**:

```bash
# Ver uso de memoria
docker stats

# Ver logs de un servicio
docker logs -f rybbit-server
docker logs -f rybbit-client
docker logs -f clickhouse

# Ver servicios corriendo
docker ps
```

**En Coolify**:
- Dashboard → Cada servicio muestra CPU/RAM en tiempo real
- Logs en tiempo real disponibles en cada servicio

---

## 🔒 Seguridad Post-Despliegue

1. **Cambia todos los passwords por defecto**:
   - `BETTER_AUTH_SECRET`
   - `POSTGRES_PASSWORD`
   - `CLICKHOUSE_PASSWORD`

2. **Configura firewall** (si Coolify no lo hace):
   ```bash
   # Solo permite 80, 443, 22 (SSH)
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

3. **Configura backups automáticos**:
   - PostgreSQL: Backups diarios (contiene usuarios, sitios, configuración)
   - ClickHouse: Backups semanales (contiene datos analíticos)

4. **Monitorea uptime**:
   - Usa UptimeRobot, BetterUptime o similar
   - Endpoint de health check: `https://app.metricslab.io/api/health`

---

## 🚀 Siguientes Pasos

Una vez desplegado:

1. **Configura OAuth** (opcional):
   - Google: https://console.cloud.google.com/apis/credentials
   - GitHub: https://github.com/settings/developers

2. **Configura Mapbox** (opcional):
   - https://account.mapbox.com/access-tokens/
   - Permite visualización de globo 3D

3. **Configura emails** (opcional):
   - Resend: https://resend.com/api-keys
   - Permite invitaciones y notificaciones

4. **Lee la documentación oficial**:
   - https://docs.rybbit.com

---

## 📞 Soporte

- **Documentación oficial**: https://docs.rybbit.com
- **GitHub Issues**: https://github.com/rybbit-io/rybbit/issues
- **Discord**: https://discord.gg/rybbit

---

**¡Listo!** Ahora tienes Rybbit Analytics corriendo en tu propio servidor con Coolify 🎉
