# Chat app Docker deployment design

## Goal

Deploy the React frontend, Node.js/Socket.IO backend, and MongoDB for
`chat.yalina.io.vn` on one VPS. Docker Compose runs the application stack.
Caddy terminates TLS and obtains and renews the certificate automatically.

## Architecture

The Compose project has four services:

- `caddy` is the only service with host ports. It listens on ports 80 and 443,
  redirects HTTP to HTTPS, and owns persistent Caddy data/config volumes for
  certificates.
- `frontend` serves the built Vite app through Nginx on the internal Compose
  network.
- `backend` runs Express and Socket.IO on internal port 3000.
- `mongo` runs MongoDB on the internal Compose network and persists data in a
  named Docker volume. It publishes no host port.

Requests to `/api/*` and `/socket.io/*` are proxied by Caddy to `backend`;
all other requests are proxied to `frontend`. This gives the browser one
HTTPS origin (`https://chat.yalina.io.vn`), avoiding cross-origin cookies and
WebSocket configuration in production.

## Container build and runtime

Frontend and backend each have a Dockerfile based on a Node LTS image. The
frontend uses a multi-stage build: `npm ci` and `npm run build` produce static
assets that are copied into a small Nginx runtime image. The backend installs
production dependencies with `npm ci --omit=dev` and starts with `node
src/index.js`.

Docker build contexts exclude `node_modules`, environment files, Vite output,
Git metadata, and local editor files. Compose uses service names for internal
DNS, so `MONGO_URL` points at `mongo` rather than localhost.

## Configuration and secrets

An untracked `.env` file on the VPS supplies `MONGO_INITDB_ROOT_USERNAME`,
`MONGO_INITDB_ROOT_PASSWORD`, `MONGO_URL`, `JWT_SECRET`, and Cloudinary
credentials. A committed `.env.example` documents every required variable
without values. The Compose file reads these values but never embeds secrets.

The backend production configuration permits `https://chat.yalina.io.vn` for
CORS and Socket.IO. Cookies remain secure when `NODE_ENV=production`.

## Operations

Before first launch, DNS for `chat.yalina.io.vn` must resolve to the VPS and
the VPS firewall/security group must allow inbound TCP 80 and 443. Launch is
`docker compose up -d --build`; certificate state and database data survive
container recreation via named volumes.

Verification checks the Compose status, the HTTPS endpoint, an API endpoint,
and a Socket.IO connection through the public domain. MongoDB remains
unreachable from outside the Compose network.

## Error handling and security

Caddy handles certificate renewal automatically. If DNS or port access is
incorrect, Caddy logs certificate-acquisition errors while the stack remains
inspectable with `docker compose logs caddy`. MongoDB is not exposed to the
Internet. `.env` stays ignored by Git, and the example file contains only
placeholders.

## Scope

This change creates production container/deployment configuration and only
adjusts existing app configuration where needed for the single production
origin. It does not add user-facing functionality, a database backup service,
or CI/CD automation.
