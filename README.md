# ChatApp deployment

Production deployment for ChatApp: a React client, Node.js API, MongoDB, and
Caddy reverse proxy running together with Docker Compose. Caddy provisions and
renews the TLS certificate for `chat.yalina.io.vn` automatically.

## VPS prerequisites

Before deploying, ensure the following are in place:

- The DNS `A` record for `chat.yalina.io.vn` points to the VPS public IPv4
  address. If the server has IPv6 connectivity, its `AAAA` record must point to
  the VPS public IPv6 address as well.
- The VPS firewall and hosting-provider firewall allow inbound TCP ports **80**
  and **443**. Caddy needs them to complete ACME certificate validation and to
  serve the application.
- Docker Engine and the Docker Compose plugin are installed and the deploying
  user can run `docker compose`.
- Git is installed.

## First deployment

Clone the repository on the VPS and enter it:

```bash
git clone https://github.com/yalog607/chat_app_deployFile.git chatapp
cd chatapp
```

Create the deployment environment file, then replace every placeholder with
real, strong secret values and the Cloudinary credentials for this application:

```bash
cp .env.example .env
chmod 600 .env
```

`JWT_SECRET` and `MONGO_INITDB_ROOT_PASSWORD` must be long, unique values.
Do not commit `.env` or share it in logs or chat messages.

Build and start the stack:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f caddy
```

The Caddy log should show successful certificate provisioning. Press `Ctrl+C`
to stop following logs; it does not stop the containers.

## Verify the deployment

From the VPS or another machine that can resolve the domain, check HTTPS:

```bash
curl -I https://chat.yalina.io.vn
```

Inspect the proxy and API logs if the response is not successful:

```bash
docker compose logs --tail=100 caddy
docker compose logs --tail=100 backend
```

Confirm that MongoDB accepts the configured admin credentials:

```bash
docker compose exec mongo mongosh --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin
```

MongoDB deliberately has no public host port. Access it only through the
Compose network or the command above.

If Caddy reports ACME or certificate-validation failures, recheck DNS records
and that inbound TCP ports 80 and 443 reach this VPS. Those are the usual
causes; wait for any DNS change to propagate before retrying.

## Update an existing deployment

Fetch the latest source and rebuild/restart the services:

```bash
git pull
docker compose up -d --build
docker compose ps
```

Follow Caddy or backend logs during the rollout when needed:

```bash
docker compose logs -f caddy
docker compose logs -f backend
```

## Local checks and contribution

Before submitting deployment-related changes, validate the rendered Compose
configuration and the frontend build and lint checks:

```bash
docker compose config
npm --prefix frontend run build
npm --prefix frontend run lint
```

Keep production configuration in `.env` only, update `.env.example` whenever a
new required setting is introduced, and never expose database credentials or
Cloudinary secrets in source control.
