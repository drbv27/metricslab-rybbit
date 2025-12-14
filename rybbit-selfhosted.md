# Quick start (/docs/self-hosting)

import { Steps, Step } from 'fumadocs-ui/components/steps';
import { Callout } from 'fumadocs-ui/components/callout';

This guide will walk you through setting up your own instance of Rybbit using our setup script. If you want to manually setup Rybbit using the Docker Compose file, check out our [Manual Docker Compose Setup](/docs/self-hosting-guides/self-hosting-manual) guide.

## Prerequisites

Before you begin, ensure you have the following:

* **A Server:** Try to get one with at least 2GB of RAM.

  We use Hetzner for everything. [Use our referral link](https://hetzner.cloud/?ref=QEdVqVpTLBDP) to get a 20 dollars of credits. It should last you almost half a year. The AMD CX11 is a good choice for \~$4/month.

* **A Domain Name:** You'll need a domain or subdomain (e.g., `tracking.yourdomain.com`) pointed to your VPS's IP address. HTTPS is required because browsers block tracking scripts served over insecure HTTP.

<Callout type="info">
  This guide has been tested on Ubuntu 24 LTS (x86\_64). If your server is ARM, it must be at least ARMv8.2-A for Clickhouse support.
</Callout>

## Setup Steps

<Steps>
  <Step>
    ### Point Your Domain to Your VPS

    Configure your domain's DNS settings to point to your VPS's public IP address. This usually involves:

    1. Finding your VPS's public IPv4 address (from your hosting provider, e.g., Hetzner).
    2. Logging into your domain registrar or DNS provider (e.g., GoDaddy, Namecheap, Cloudflare).
    3. Adding an `A` record:
       * **Host/Name:** Your desired subdomain (e.g., `tracking`) or `@` for the root domain.
       * **Value:** Your VPS's IPv4 address.
       * **Proxy Status:** When using Cloudflare, either:
         * Set to "DNS only" (recommended for most setups)
         * Or if keeping the proxy enabled, set SSL/TLS encryption mode to "Full" or "Full (strict)" in your Cloudflare dashboard under SSL/TLS settings

    <Callout type="warning">
      If you keep Cloudflare's proxy enabled and your domain has other services not running on HTTPS, using Full or Full (strict) mode might cause issues with those services. In such cases, either use "DNS only" mode or ensure all your services support HTTPS.
    </Callout>

    DNS changes might take some time to propagate globally. Use [DNS Checker](https://dnschecker.org/) to verify.
  </Step>

  <Step>
    ### Install Docker Engine

    Connect to your VPS via SSH.

    Follow the official Docker Engine installation instructions for your Linux distribution:
    [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)
  </Step>

  <Step>
    ### Clone the Rybbit Repository

    Clone the project repository from GitHub (Git is usually pre-installed on most server distributions):

    ```bash
    git clone https://github.com/rybbit-io/rybbit.git
    cd rybbit
    ```
  </Step>

  <Step>
    ### Run the Setup Script

    The repository includes a setup script that configures the necessary environment variables (including generating a secure secret) and starts the application using Docker Compose.

    <Callout type="warning">
      Important: Make all scripts executable before proceeding!

      ```bash
      chmod +x *.sh
      ```
    </Callout>

    Run the setup script, replacing `your.domain.name` with the domain or subdomain you configured in the prerequisites:

    ```bash
    ./setup.sh your.domain.name
    ```

    If you want to enable 3D map visualizations, you can add the `--mapbox-token` flag:

    ```bash
    ./setup.sh your.domain.name --mapbox-token YOUR_MAPBOX_TOKEN
    ```

    The script will create a `.env` file and then build and start the containers. This might take a few minutes the first time.

    <Callout type="info">
      By default, we assume you are on a blank VPS and automatically setup a Caddy webserver. If you want to use your own webserver or need more control over the setup, check out:

      * [Manual Docker Compose Setup](/docs/self-hosting-guides/self-hosting-manual) - For users with existing reverse proxies or deployment tools
      * [Advanced Self-Hosting Guide](/docs/self-hosting-guides/self-hosting-advanced) - For custom configurations and Nginx setup
    </Callout>
  </Step>

  <Step>
    ### Sign Up

    Once the services are running and DNS has propagated, Caddy (the webserver) will automatically obtain an SSL certificate for your domain.

    Open your browser and navigate to `https://your.domain.name/signup` (using the domain you provided to the setup script).

    Create your admin account. You can then log in and start adding your websites!
  </Step>
</Steps>

If you run into any issues or need help, feel free to join our Discord community!

# Managing your installation (/docs/managing-your-installation)

import { Steps, Step } from 'fumadocs-ui/components/steps';
import { Callout } from 'fumadocs-ui/components/callout';

## Helpful scripts

<Callout>
  You probably need to run `chmod +x *.sh` before running the scripts.
</Callout>

### Updating Your Installation

Rybbit is updated frequently with new features and bug fixes. You can update your installation by running the following commands:

**update.sh**: Update to the latest version by pulling new code and rebuilding containers

```bash
git pull
./update.sh
```

### Restarting Your Installation

**restart.sh**: Restart all services (useful when you've changed .env settings)

```bash
./restart.sh
```

## Docker Compose Commands

You can also manage services directly with Docker Compose:

* **Stop all services**:
  ```bash
  docker compose stop
  ```

* **Stop and remove containers** (preserves data):
  ```bash
  docker compose down
  ```

* **Start services** (if you used setup.sh with default webserver):
  ```bash
  docker compose --profile with-webserver up -d
  ```

* **Start services** (if you used setup.sh with --no-webserver):
  ```bash
  docker compose up -d
  ```

* **View logs**:
  ```bash
  docker compose logs -f
  ```

<Callout>
  If you are using your self-hosted Rybbit without anyone else, you can disable new user signups by setting `DISABLE_SIGNUP=true` in the `.env` file at the root of the repository.
</Callout>

## Database Access

You can access the databases by running the following commands:

* **Access Clickhouse**:
  ```bash
  docker exec -it clickhouse clickhouse-client --database analytics
  ```

* **Access Postgres**:
  ```bash
  docker exec -it postgres psql -U frog -d analytics
  ```

### Edit Session Replay Retention Policy

The default session replay retention policy is 30 days. This may be too long for some users as session replays can take up a lot of space. You can edit it by running the following command:

```bash
docker exec -it clickhouse clickhouse-client --database analytics
ALTER TABLE session_replay_events MODIFY TTL toDateTime(timestamp) + INTERVAL 14 DAY;
ALTER TABLE session_replay_metadata MODIFY TTL start_time + INTERVAL 14 DAY;
```

## Anonymous Usage Telemetry

To help us improve Rybbit, self-hosted instances automatically send anonymous usage statistics to our cloud service. This includes:

* Number of rows in each ClickHouse table
* Total database size
* Your Rybbit version
* A hashed instance identifier

No personal data, website content, or visitor information is ever collected.

<Callout type="info">
  You can completely disable telemetry by adding `DISABLE_TELEMETRY=true` to your `.env` file and restarting your services.
</Callout>


# Troubleshooting (/docs/troubleshooting)

import { Steps, Step } from 'fumadocs-ui/components/steps';
import { Callout } from 'fumadocs-ui/components/callout';

## Full Docker Cleanup

If you encounter issues with Docker containers, images, or volumes and need to start fresh, you can perform a complete Docker cleanup. This will remove all containers, images, volumes, and custom networks.

<Callout type="warn">
  **Warning**: This will remove ALL Docker containers, images, and volumes on your system, not just Rybbit-related ones. Make sure you don't have other important Docker containers running.
</Callout>

### Steps for Complete Docker Cleanup

<Steps>
  <Step>
    ### Remove your environment file

    ```bash
    rm .env
    ```
  </Step>

  <Step>
    ### Stop all running containers:

    ```bash
    docker stop $(docker ps -q)
    ```
  </Step>

  <Step>
    ### Remove all containers (both running and stopped):

    ```bash
    docker rm -f $(docker ps -aq)
    ```
  </Step>

  <Step>
    ### Remove all images:

    ```bash
    docker rmi -f $(docker images -q)
    ```
  </Step>

  <Step>
    ### Remove all volumes:

    ```bash
    docker volume rm -f $(docker volume ls -q)
    ```
  </Step>

  <Step>
    ### Remove all custom networks (preserves default networks):

    ```bash
    docker network rm $(docker network ls | grep -v "bridge\|host\|none" | awk '{print $1}')
    ```
  </Step>
</Steps>

### Alternative: Rybbit-Specific Cleanup

If you only want to clean up Rybbit-related Docker resources without affecting other containers, use these commands instead:

```bash
# Stop and remove Rybbit containers
docker-compose down

# Remove Rybbit images
docker-compose down --rmi all

# Remove Rybbit volumes (this will delete your data!)
docker-compose down --volumes

# Complete Rybbit cleanup
docker-compose down --rmi all --volumes --remove-orphans
```

### After Cleanup

Once you've completed the cleanup, you can restart Rybbit by following the setup instructions:

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Then start the services
docker-compose up -d
```

## I ran out of disk space

Regular web analytics events take up almost no space in Clickhouse, so it is very unlikely that you ran out of disk space from from this. There are two main reasons why you might have run out of disk space:

### 1. You are using session replay

On self-hosted instances where we don't have access to S3 compatible object storage, session replays are stored in Clickhouse. Each session replay is at least 1000x the data footprint of the web analytics events. So it's very easy to run out of disk space.

We have a 30 day retention policy for session replays events, so if you turn off session replay, your disk space will slowly come back. If you need to immediately free up space, you can truncate the session replays table:

```bash
docker exec -it clickhouse clickhouse-client --database analytics

TRUNCATE TABLE session_replay_events;
TRUNCATE TABLE session_replay_metadata;
```

### 2. You didn't mount the Clickhouse log suppression configs

In our [docker-compose.yml](https://github.com/rybbit-io/rybbit/blob/master/docker-compose.ymlg), we have a config for Clickhouse that suppresses logs. Clickhouse stores a ton of logs in the log tables by default. This will quickly fill up your disk space if left unchecked.

If you follow the standard installation process, the configs are already mounted for you. If you rolled your own Docker setup, you need to mount the configs manually.


# Custom Nginx setup (/docs/self-hosting-guides/custom-nginx)

import { Steps, Step } from 'fumadocs-ui/components/steps';
import { Callout } from 'fumadocs-ui/components/callout';

This guide shows you how to set up Rybbit with your own Nginx installation instead of using the built-in Caddy server.

## Prerequisites

* Existing Nginx installation
* SSL certificates (Let's Encrypt recommended)
* Domain pointed to your server
* Rybbit running with `--no-webserver` flag

## Setup Steps

<Steps>
  <Step>
    ### Run Rybbit without Caddy

    First, set up Rybbit to expose ports without the built-in webserver:

    ```bash
    ./setup.sh your.domain.name --no-webserver
    ```

    Optionally, include a Mapbox token for globe visualizations:

    ```bash
    ./setup.sh your.domain.name --no-webserver --mapbox-token YOUR_MAPBOX_TOKEN
    ```

    This will expose:

    * Backend service on port 3001
    * Client service on port 3002
  </Step>

  <Step>
    ### Configure Nginx

    Create or update your Nginx configuration file (usually in `/etc/nginx/sites-available/`):

    ```nginx
    server {
        listen 80;
        server_name your.domain.name;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your.domain.name;

        # SSL configuration (using Let's Encrypt)
        ssl_certificate /etc/letsencrypt/live/your.domain.name/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your.domain.name/privkey.pem;
        
        # Modern SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API requests
        location /api/ {
            proxy_pass http://localhost:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $server_name;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Client app
        location / {
            proxy_pass http://localhost:3002;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $server_name;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
    ```
  </Step>

  <Step>
    ### Enable the Site

    Enable your Nginx configuration:

    ```bash
    # Create symlink to enable the site
    sudo ln -s /etc/nginx/sites-available/your-site /etc/nginx/sites-enabled/

    # Test the configuration
    sudo nginx -t

    # Reload Nginx
    sudo systemctl reload nginx
    ```
  </Step>

  <Step>
    ### Verify Setup

    Check that everything is working:

    ```bash
    # Check Nginx status
    sudo systemctl status nginx

    # Check Rybbit services
    docker compose ps

    # Test the website
    curl -I https://your.domain.name
    ```
  </Step>
</Steps>

## SSL Certificate Setup with Certbot

If you need to set up SSL certificates with Let's Encrypt:

<Steps>
  <Step>
    ### Install Certbot

    ```bash
    # Ubuntu/Debian
    sudo apt update
    sudo apt install certbot python3-certbot-nginx

    # CentOS/RHEL
    sudo yum install certbot python3-certbot-nginx
    ```
  </Step>

  <Step>
    ### Obtain Certificate

    ```bash
    sudo certbot --nginx -d your.domain.name
    ```
  </Step>

  <Step>
    ### Auto-renewal

    Set up automatic renewal:

    ```bash
    # Test renewal
    sudo certbot renew --dry-run

    # Check existing cron job
    sudo crontab -l
    ```

    Certbot usually sets up auto-renewal automatically, but you can add this cron job if needed:

    ```bash
    0 12 * * * /usr/bin/certbot renew --quiet
    ```
  </Step>
</Steps>

## Custom Ports

If you need to use custom ports for Rybbit:

```bash
./setup.sh your.domain.name --no-webserver --backend-port 8080 --client-port 8081

# With Mapbox token
./setup.sh your.domain.name --no-webserver --backend-port 8080 --client-port 8081 --mapbox-token YOUR_MAPBOX_TOKEN
```

Update your Nginx configuration accordingly:

```nginx
location /api/ {
    proxy_pass http://localhost:8080;  # Custom backend port
    # ... rest of config
}

location / {
    proxy_pass http://localhost:8081;  # Custom client port
    # ... rest of config
}
```

## Troubleshooting

### Common Issues

**502 Bad Gateway**: Check if Rybbit services are running:

```bash
docker compose ps
docker compose logs
```

**SSL Certificate Issues**: Verify certificate paths:

```bash
sudo certbot certificates
```

**Permission Denied**: Check Nginx error logs:

```bash
sudo tail -f /var/log/nginx/error.log
```

### Logs

Monitor logs for debugging:

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Rybbit logs
docker compose logs -f
```

# Nginx Proxy Manager (NPM) setup (/docs/self-hosting-guides/nginx-proxy-manager)

import { Steps, Step } from 'fumadocs-ui/components/steps';
import { Callout } from 'fumadocs-ui/components/callout';

This guide shows you how to set up Rybbit with Nginx Proxy Manager without exposing ports directly to the host.

## Prerequisites

* [Nginx Proxy Manager](https://nginxproxymanager.com) already running
* Basic knowledge of Docker networks
* Domain name pointed to your server

<Callout type="info">
  This setup assumes you have NPM running and are capable of creating SSL certificates. You can also use any other reverse proxy as long as you can put it on the same Docker network as Rybbit.
</Callout>

## Setup Steps

<Steps>
  <Step>
    ### Create Custom Docker Compose

    Create a new directory for your Rybbit installation and create a `docker-compose.yml` file:

    ```yaml
    services:
      rybbit_clickhouse:
        image: clickhouse/clickhouse-server:25.4.2
        container_name: rybbit_clickhouse
        volumes:
          - ./clickhouse-data:/var/lib/clickhouse
          - ./clickhouse_config:/etc/clickhouse-server/config.d
        environment:
          - CLICKHOUSE_DB=${CLICKHOUSE_DB:-analytics}
          - CLICKHOUSE_USER=${CLICKHOUSE_USER:-default}
          - CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD:-frog}
        healthcheck:
          test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8123/ping"]
          interval: 3s
          timeout: 5s
          retries: 5
          start_period: 10s
        restart: unless-stopped
        networks:
          - internal

      rybbit_postgres:
        image: postgres:17.4
        container_name: rybbit_postgres
        environment:
          - POSTGRES_USER=${POSTGRES_USER:-frog}
          - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-frog}
          - POSTGRES_DB=${POSTGRES_DB:-analytics}
        volumes:
          - ./postgres-data:/var/lib/postgresql/data
        healthcheck:
          test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
          interval: 3s
          timeout: 5s
          retries: 5
          start_period: 10s
        restart: unless-stopped
        networks:
          - internal

      rybbit_backend:
        image: ghcr.io/rybbit-io/rybbit-backend:${IMAGE_TAG:-latest}
        container_name: rybbit_backend
        environment:
          - NODE_ENV=production
          - CLICKHOUSE_HOST=http://rybbit_clickhouse:8123
          - CLICKHOUSE_DB=${CLICKHOUSE_DB:-analytics}
          - CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD:-frog}
          - POSTGRES_HOST=rybbit_postgres
          - POSTGRES_PORT=5432
          - POSTGRES_DB=${POSTGRES_DB:-analytics}
          - POSTGRES_USER=${POSTGRES_USER:-frog}
          - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-frog}
          - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
          - BASE_URL=${BASE_URL}
          - DISABLE_SIGNUP=${DISABLE_SIGNUP}
          - MAPBOX_TOKEN=${MAPBOX_TOKEN}
        depends_on:
          rybbit_clickhouse:
            condition: service_healthy
          rybbit_postgres:
            condition: service_started
        healthcheck:
          test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3001/api/health"]
          interval: 3s
          timeout: 5s
          retries: 5
          start_period: 10s
        restart: unless-stopped
        networks:
          - internal
          - npm_proxy

      rybbit_client:
        image: ghcr.io/rybbit-io/rybbit-client:${IMAGE_TAG:-latest}
        container_name: rybbit_client
        environment:
          - NODE_ENV=production
          - NEXT_PUBLIC_BACKEND_URL=${BASE_URL}
          - NEXT_PUBLIC_DISABLE_SIGNUP=${DISABLE_SIGNUP}
        depends_on:
          - rybbit_backend
        restart: unless-stopped
        networks:
          - internal
          - npm_proxy

    networks:
      internal:
        driver: bridge
      npm_proxy:
        external: true

    volumes:
      clickhouse-data:
      postgres-data:
    ```
  </Step>

  <Step>
    ### Configure Environment

    Create a `.env` file in the same directory:

    ```bash
    # Required: Your domain and base URL
    DOMAIN_NAME=your.domain.com
    BASE_URL=https://your.domain.com

    # Required: Authentication secret (generate a random 32+ character string)
    BETTER_AUTH_SECRET=your_generated_secret_here

    # Optional: Disable new user signups after creating admin account
    DISABLE_SIGNUP=false

    # Optional but recommended: Mapbox token for globe visualizations
    MAPBOX_TOKEN=your_mapbox_token

    # Optional: Custom image tag
    IMAGE_TAG=latest
    ```

    <Callout type="info">
      Generate a secure `BETTER_AUTH_SECRET` using: `openssl rand -hex 32`
    </Callout>
  </Step>

  <Step>
    ### Setup Docker Network

    Create the external network that NPM uses (if it doesn't exist):

    ```bash
    docker network create npm_proxy
    ```

    Make sure your NPM container is connected to this network:

    ```bash
    # Check if NPM is on the network
    docker network inspect npm_proxy

    # If needed, connect NPM to the network
    docker network connect npm_proxy <npm_container_name>
    ```
  </Step>

  <Step>
    ### Copy ClickHouse Config (Optional)

    Optionally, copy the ClickHouse configuration for better control:

    ```bash
    # If you cloned the main repo, copy the config
    cp -r /path/to/rybbit/clickhouse_config ./

    # Or download it directly
    curl -L https://github.com/rybbit-io/rybbit/archive/master.tar.gz | tar -xz --strip=2 rybbit-master/clickhouse_config
    ```
  </Step>

  <Step>
    ### Start Services

    Start all Rybbit services:

    ```bash
    docker compose up -d
    ```

    Verify all services are running:

    ```bash
    docker compose ps
    ```
  </Step>

  <Step>
    ### Configure NPM

    In your Nginx Proxy Manager interface:

    1. **Create Proxy Host**:
       * Domain Names: `your.domain.com`
       * Scheme: `http`
       * Forward Hostname/IP: `rybbit_client`
       * Forward Port: `3002`
       * Enable "Cache Assets", "Block Common Exploits", "Websockets Support"

    2. **Add Custom Location**:
       * Location: `/api`
       * Scheme: `http`
       * Forward Hostname/IP: `rybbit_backend`
       * Forward Port: `3001`

    3. **Advanced Configuration** (in the custom location):
       ```nginx
       location /api/ {
           proxy_pass http://rybbit_backend:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       ```

    4. **SSL Configuration**:
       * Enable SSL
       * Request a new SSL certificate with Let's Encrypt
       * Enable "Force SSL" and "HTTP/2 Support"
  </Step>

  <Step>
    ### Access Rybbit

    Navigate to `https://your.domain.com` and create your admin account.
  </Step>
</Steps>

## Alternative Proxy Configurations

### Traefik

If you're using Traefik instead, add these labels to your services:

```yaml
services:
  rybbit_backend:
    # ... existing config
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.rybbit-api.rule=Host(`your.domain.com`) && PathPrefix(`/api`)"
      - "traefik.http.routers.rybbit-api.tls.certresolver=letsencrypt"
      - "traefik.http.services.rybbit-api.loadbalancer.server.port=3001"
      - "traefik.docker.network=traefik_proxy"
  
  rybbit_client:
    # ... existing config
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.rybbit-client.rule=Host(`your.domain.com`)"
      - "traefik.http.routers.rybbit-client.tls.certresolver=letsencrypt"
      - "traefik.http.services.rybbit-client.loadbalancer.server.port=3002"
      - "traefik.docker.network=traefik_proxy"

networks:
  traefik_proxy:
    external: true
```

### Cloudflare Tunnel

For Cloudflare Tunnel, create a tunnel configuration:

```yaml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  - hostname: your.domain.com
    path: /api
    service: http://rybbit_backend:3001
  - hostname: your.domain.com
    service: http://rybbit_client:3002
  - service: http_status:404
```

## Troubleshooting

### Common Issues

**NPM can't reach containers**:

* Verify both NPM and Rybbit are on the same network
* Check container names match the proxy configuration

**SSL certificate issues**:

* Ensure domain is pointed to your server
* Check NPM logs for certificate generation errors

**502 Bad Gateway**:

* Verify Rybbit services are healthy: `docker compose ps`
* Check container logs: `docker compose logs`

### Networking

Check network connectivity:

```bash
# List all networks
docker network ls

# Inspect the npm_proxy network
docker network inspect npm_proxy

# Check which containers are connected
docker ps --format "table {{.Names}}\t{{.Networks}}"
```

### Logs

Monitor logs for debugging:

```bash
# Rybbit services
docker compose logs -f

# Specific service
docker compose logs -f rybbit_backend

# NPM logs (adjust container name)
docker logs -f nginx-proxy-manager
```

<Callout type="warning">
  Remember to regularly backup your data volumes (`clickhouse-data` and `postgres-data`) and your `.env` file.
</Callout>

# Advanced self-hosting (/docs/self-hosting-guides/self-hosting-advanced)

import { Callout } from 'fumadocs-ui/components/callout';

This guide covers advanced configuration options for self-hosting Rybbit.

## Setup Script Options

The setup script supports several options:

```bash
./setup.sh <domain_name> [options]
```

Available options:

* `--no-webserver`: Disable the built-in Caddy webserver
* `--backend-port <port>`: Set custom host port for backend (default: 3001)
* `--client-port <port>`: Set custom host port for client (default: 3002)
* `--mapbox-token <token>`: Set Mapbox API token (optional but recommended for globe visualizations)
* `--help`: Show help message

Examples:

```bash
# With Mapbox token
./setup.sh tracking.example.com --mapbox-token YOUR_MAPBOX_TOKEN

# Custom ports with built-in webserver
./setup.sh tracking.example.com --backend-port 8080 --client-port 8081

# Custom ports with your own webserver
./setup.sh tracking.example.com --no-webserver --backend-port 8080 --client-port 8081
```

<Callout type="info">
  When you specify custom ports, only the host port mapping changes. Inside the Docker containers, the services still use ports 3001 and 3002.
</Callout>

## Using Your Own Web Server

If you prefer to use your own web server instead of the built-in Caddy server, you can use the `--no-webserver` flag:

```bash
./setup.sh your.domain.name --no-webserver
```

This will:

* Not start the Caddy container
* Expose the backend service on host port 3001 (or your custom port)
* Expose the client service on host port 3002 (or your custom port)

<Callout type="info">
  For detailed configuration examples with Nginx, Traefik, NPM, and other reverse proxies, see our [Manual Docker Compose Setup](/docs/self-hosting-guides/self-hosting-manual) guide.
</Callout>

## Environment Variables

The setup script creates a minimal `.env` file with only the essential variables:

```bash
DOMAIN_NAME=your.domain.com
BASE_URL=https://your.domain.com
BETTER_AUTH_SECRET=generated_secret
DISABLE_SIGNUP=false
```

Optional variables that can be added:

```bash
# Mapbox token for 3D map visualizations
MAPBOX_TOKEN=your_mapbox_token

# Database configuration (uses defaults if not specified)
CLICKHOUSE_PASSWORD=frog
POSTGRES_USER=frog
POSTGRES_PASSWORD=frog
POSTGRES_DB=analytics
CLICKHOUSE_DB=analytics

# Custom image tags
IMAGE_TAG=latest

# Port mapping (only needed for custom ports or --no-webserver)
HOST_BACKEND_PORT="3001:3001"
HOST_CLIENT_PORT="3002:3002"
```
# Manual Docker Compose setup (/docs/self-hosting-guides/self-hosting-manual)

import { Callout } from 'fumadocs-ui/components/callout';
import { Steps, Step } from 'fumadocs-ui/components/steps';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';

This guide is for users who want to manually set up Rybbit using Docker Compose without the setup script. This is useful if you already have a reverse proxy setup (like Nginx, Traefik, or Coolify), or if you want more control over the configuration.

## Prerequisites

* Docker and Docker Compose installed
* A domain name pointed to your server
* Basic knowledge of Docker and environment variables

## Setup Steps

<Steps>
  <Step>
    ### Clone the Repository

    ```bash
    git clone https://github.com/rybbit-io/rybbit.git
    cd rybbit
    ```
  </Step>

  <Step>
    ### Create Environment File

    Create a `.env` file in the root directory with the following content:

    ```bash
    # Required: Your domain and base URL
    DOMAIN_NAME=your.domain.com
    BASE_URL=https://your.domain.com

    # Required: Authentication secret (generate a random 32+ character string)
    BETTER_AUTH_SECRET=your-very-long-random-secret-string-here

    # Optional: Disable new user signups after creating admin account
    DISABLE_SIGNUP=false

    # Optional but recommended: Mapbox token for globe visualizations
    MAPBOX_TOKEN=your_mapbox_token

    # Optional: Custom ports (only needed if you want different ports)
    # HOST_BACKEND_PORT="3001:3001"
    # HOST_CLIENT_PORT="3002:3002"

    # Optional: Database credentials (defaults work fine)
    # CLICKHOUSE_PASSWORD=frog
    # POSTGRES_USER=frog
    # POSTGRES_PASSWORD=frog
    # POSTGRES_DB=analytics
    # CLICKHOUSE_DB=analytics
    ```

    <Callout type="info">
      To generate a secure `BETTER_AUTH_SECRET`, you can use:

      ```bash
      openssl rand -hex 32
      ```
    </Callout>
  </Step>

  <Step>
    ### Choose Your Setup Method

    <Tabs items={['Built-in Caddy (Automatic SSL)', 'Without Caddy']}>
      <Tab value="Built-in Caddy (Automatic SSL)">
        If you don't have a reverse proxy and want automatic SSL certificates, use the default docker-compose.yml:

        ```bash
        docker compose up -d
        ```

        This will:

        * Start all services including Caddy
        * Automatically obtain SSL certificates
        * Make your app available at `https://your.domain.com`
      </Tab>

      <Tab value="Without Caddy">
        If you have your own reverse proxy (Nginx, Traefik, Coolify, etc.), you need to exclude Caddy and expose the ports:

        1. **Option B1: Modify the .env file**

           ```bash
           # Add these lines to expose ports
           HOST_BACKEND_PORT="3001:3001"
           HOST_CLIENT_PORT="3002:3002"
           ```

           Then start without Caddy:

           ```bash
           docker compose up -d backend client clickhouse postgres
           ```

        2. **Option B2: Use docker-compose.override.yml**
           Create a `docker-compose.override.yml` file:

           ```yaml
           services:
             backend:
               ports:
                 - "3001:3001"
             client:
               ports:
                 - "3002:3002"
           ```

           Then start without Caddy:

           ```bash
           docker compose up -d backend client clickhouse postgres
           ```
      </Tab>
    </Tabs>
  </Step>

  <Step>
    ### Configure Your Reverse Proxy

    If you're using your own reverse proxy, configure it to:

    * Proxy requests to `/api/*` to `http://localhost:3001`
    * Proxy all other requests to `http://localhost:3002`

    Example configurations:

    <Tabs items={['Nginx', 'Traefik']}>
      <Tab value="Nginx">
        ```nginx
        server {
            listen 80;
            server_name your.domain.com;
            return 301 https://$host$request_uri;
        }

        server {
            listen 443 ssl;
            server_name your.domain.com;

            # Your SSL configuration here

            location /api/ {
                proxy_pass http://localhost:3001;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            location / {
                proxy_pass http://localhost:3002;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
        }
        ```
      </Tab>

      <Tab value="Traefik">
        ```yml
        services:
          backend:
            labels:
              - "traefik.enable=true"
              - "traefik.http.routers.rybbit-api.rule=Host(`your.domain.com`) && PathPrefix(`/api`)"
              - "traefik.http.routers.rybbit-api.tls.certresolver=letsencrypt"
              - "traefik.http.services.rybbit-api.loadbalancer.server.port=3001"
          
          client:
            labels:
              - "traefik.enable=true"
              - "traefik.http.routers.rybbit-client.rule=Host(`your.domain.com`)"
              - "traefik.http.routers.rybbit-client.tls.certresolver=letsencrypt"
              - "traefik.http.services.rybbit-client.loadbalancer.server.port=3002"
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step>
    ### Start the Services

    ```bash
    # Start all services
    docker compose up -d

    # Or start specific services (without Caddy)
    docker compose up -d backend client clickhouse postgres
    ```
  </Step>

  <Step>
    ### Verify Setup

    Check that all services are running:

    ```bash
    docker compose ps
    ```

    Monitor logs:

    ```bash
    docker compose logs -f
    ```
  </Step>

  <Step>
    ### Create Admin Account

    Navigate to `https://your.domain.com/signup` and create your admin account.
  </Step>
</Steps>

## Service Architecture

Rybbit consists of these services:

* **client**: Next.js frontend (port 3002)
* **backend**: Node.js API server (port 3001)
* **postgres**: User data and configuration
* **clickhouse**: Analytics data storage
* **caddy**: Reverse proxy with automatic SSL (optional)

## Common Configurations

### Using Custom Ports

If you need different host ports (e.g., if 3001/3002 are already in use):

```bash
HOST_BACKEND_PORT="8080:3001"
HOST_CLIENT_PORT="8081:3002"
```

### Using with Coolify

Since Coolify uses Traefik instead of Caddy as proxy, some modifications have to be made in a `docker-compose.yaml` file to avoid conflicts. Specifically, you need to:

* remove Caddy service and volumes
* add network labels to all services
* remove `build` and `ports` properties from backend and client services

Here's a modified version of docker-compose that works on Coolify:

```yaml
services:
  clickhouse:
    container_name: clickhouse
    image: clickhouse/clickhouse-server:25.4.2
    volumes:
      - clickhouse-data:/var/lib/clickhouse
    configs:
      - source: clickhouse_network
        target: /etc/clickhouse-server/config.d/network.xml
      - source: clickhouse_json
        target: /etc/clickhouse-server/config.d/enable_json.xml
      - source: clickhouse_logging
        target: /etc/clickhouse-server/config.d/logging_rules.xml
      - source: clickhouse_user_logging
        target: /etc/clickhouse-server/config.d/user_logging.xml
    environment:
      - CLICKHOUSE_DB=${CLICKHOUSE_DB:-analytics}
      - CLICKHOUSE_USER=${CLICKHOUSE_USER:-default}
      - CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD:-frog}
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://localhost:8123/ping",
        ]
      interval: 3s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped
    labels:
      - traefik.enable=false

  postgres:
    image: postgres:17.4
    container_name: postgres
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-frog}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-frog}
      - POSTGRES_DB=${POSTGRES_DB:-analytics}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 3s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped
    labels:
      - traefik.enable=false

  backend:
    image: ghcr.io/rybbit-io/rybbit-backend:${IMAGE_TAG:-latest}
    container_name: backend
    environment:
      - NODE_ENV=production
      - CLICKHOUSE_HOST=http://clickhouse:8123
      - CLICKHOUSE_DB=${CLICKHOUSE_DB:-analytics}
      - CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD:-frog}
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_DB=${POSTGRES_DB:-analytics}
      - POSTGRES_USER=${POSTGRES_USER:-frog}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-frog}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BASE_URL=${BASE_URL}
      - DOMAIN_NAME=${DOMAIN_NAME}
      - DISABLE_SIGNUP=${DISABLE_SIGNUP}
      - DISABLE_TELEMETRY=${DISABLE_TELEMETRY}
      - MAPBOX_TOKEN=${MAPBOX_TOKEN}
    depends_on:
      clickhouse:
        condition: service_healthy
      postgres:
        condition: service_started
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://127.0.0.1:3001/api/health",
        ]
      interval: 3s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped
    labels:
      - traefik.enable=true
      - traefik.docker.network=coolify
      - traefik.http.routers.rybbit-backend.entrypoints=https
      - traefik.http.routers.rybbit-backend.tls=true
      - traefik.http.routers.rybbit-backend.rule=Host(`${DOMAIN_NAME}`) && (Path(`/api`) || PathPrefix(`/api/`))
      - traefik.http.services.rybbit-backend.loadbalancer.server.port=3001
      - traefik.http.routers.rybbit-backend.priority=100
      - traefik.http.middlewares.rybbit-forward-headers.headers.customrequestheaders.X-Forwarded-Proto=https
      - traefik.http.middlewares.rybbit-forward-headers.headers.customrequestheaders.X-Forwarded-Host=${DOMAIN_NAME}
      - traefik.http.routers.rybbit-backend.middlewares=rybbit-forward-headers

  client:
    image: ghcr.io/rybbit-io/rybbit-client:${IMAGE_TAG:-latest}
    container_name: client
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_BACKEND_URL=${BASE_URL}
      - NEXT_PUBLIC_DISABLE_SIGNUP=${DISABLE_SIGNUP}
      - DOMAIN_NAME=${DOMAIN_NAME}
    depends_on:
      - backend
    restart: unless-stopped
    labels:
      - traefik.enable=true
      - traefik.docker.network=coolify
      - traefik.http.routers.rybbit-client.entrypoints=https
      - traefik.http.routers.rybbit-client.tls=true
      - traefik.http.routers.rybbit-client.rule=Host(`${DOMAIN_NAME}`)
      - traefik.http.services.rybbit-client.loadbalancer.server.port=3002
      - traefik.http.routers.rybbit-client.priority=10

volumes:
  clickhouse-data:
  postgres-data:
  redis-data:

configs:
  clickhouse_network:
    content: |
      <clickhouse>
          <listen_host>0.0.0.0</listen_host>
      </clickhouse>

  clickhouse_json:
    content: |
      <clickhouse>
          <settings>
              <enable_json_type>1</enable_json_type>
          </settings>
      </clickhouse>

  clickhouse_logging:
    content: |
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
        <latency_log remove="remove"/>
        <processors_profile_log remove="remove"/>
      </clickhouse>

  clickhouse_user_logging:
    content: |
      <clickhouse>
        <profiles>
          <default>
            <log_queries>0</log_queries>
            <log_query_threads>0</log_query_threads>
            <log_processors_profiles>0</log_processors_profiles>
          </default>
        </profiles>
      </clickhouse>
```

To deploy Rybbit on Coolify, you need to:

1. Create a new project and resource using `docker-compose.yaml` file provided above
2. Make sure "Escape special characters in labels" option is unchecked when adding docker-compose file so that env variables in labels are read properly
3. Set the environment variables in Coolify's interface
4. Add a domain for `client` service in Coolify's interface
5. Deploy all services

Note: you don't need to add a domain for `backend` service in Coolify since client and backend services share the same domain.

### Using with Nginx Proxy Manager

1. Set up port exposure in your .env:
   ```bash
   HOST_BACKEND_PORT="3001:3001"
   HOST_CLIENT_PORT="3002:3002"
   ```

2. Create a proxy host pointing to your server IP:3002

3. Add a custom location `/api/*` pointing to your server IP:3001

### Database Persistence

Data is automatically persisted in Docker volumes:

* `rybbit_clickhouse-data`: Analytics data
* `rybbit_postgres-data`: User accounts and site configurations

## Advanced Configurations

For specific reverse proxy setups, see our detailed guides:

* **[Custom Nginx Setup](/docs/self-hosting-guides/custom-nginx)** - Complete Nginx configuration with SSL
* **[Nginx Proxy Manager](/docs/self-hosting-guides/nginx-proxy-manager)** - NPM setup without port exposure

These guides provide step-by-step instructions for integrating Rybbit with your existing infrastructure.

## Troubleshooting

### Services won't start

```bash
# Check logs
docker compose logs

# Check service status
docker compose ps
```

### Port conflicts

If you get port binding errors, either:

1. Change the host ports in your .env file
2. Stop the conflicting service
3. Use docker-compose.override.yml to customize ports

### Database connection issues

Ensure the database services are healthy:

```bash
docker compose ps
```

Both postgres and clickhouse should show "healthy" status.

<Callout type="info">
  For more advanced configurations and setup script options, see our [Advanced Self-Hosting Guide](/docs/self-hosting-guides/self-hosting-advanced).
</Callout>

