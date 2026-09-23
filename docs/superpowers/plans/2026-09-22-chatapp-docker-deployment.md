# Chat App Docker Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the chat frontend, backend, MongoDB, and TLS reverse proxy on a VPS through `https://chat.yalina.io.vn`.

**Architecture:** Docker Compose creates private services for the React frontend, Express/Socket.IO backend, and MongoDB. Caddy is the only public service, redirects HTTP to HTTPS, and proxies API/WebSocket requests to backend while serving the frontend for all other paths.

**Tech Stack:** Docker, Docker Compose, Caddy 2, Nginx Alpine, Node.js 22 Alpine, React/Vite, Express, Socket.IO, MongoDB 8.

**Spec:** `docs/superpowers/specs/2026-09-22-chatapp-docker-deployment-design.md`

## Global Constraints

- Public origin is exactly `https://chat.yalina.io.vn`.
- Only Caddy may publish host ports 80 and 443.
- MongoDB must stay reachable only on the Compose network and persist in a named volume.
- Secrets must come from an ignored VPS `.env`; commit only placeholder values in `.env.example`.
- Preserve local Vite development behavior while allowing the production origin for Express and Socket.IO.

---

## File Structure

- `backend/Dockerfile`: production Node runtime for Express/Socket.IO.
- `frontend/Dockerfile`: build Vite then serve static output through Nginx.
- `frontend/nginx.conf`: SPA fallback and static-asset serving on port 80.
- `Caddyfile`: automatic TLS and path-based reverse proxy rules.
- `compose.yml`: four-service production stack, internal network, and durable volumes.
- `.dockerignore`: excludes dependencies, build output, secrets, and Git files.
- `.env.example`: required deployment variables without values.
- `backend/src/index.js` and `backend/lib/socket.js`: configurable CORS origin.
- `README.md`: VPS deployment and diagnostics runbook.

### Task 1: Make backend CORS deployable

**Files:**
- Modify: `backend/src/index.js:18-21`
- Modify: `backend/lib/socket.js:7-10`

**Interfaces:**
- Consumes: optional `CLIENT_ORIGIN` string.
- Produces: Express and Socket.IO both accept that origin, defaulting to `http://localhost:5173`.

- [ ] **Step 1: Add the origin resolver in both files**

```js
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
```

- [ ] **Step 2: Replace CORS configuration**

```js
app.use(cors({ origin: clientOrigin, credentials: true }));
const io = new Server(server, {
  cors: { origin: [clientOrigin], credentials: true },
});
```

- [ ] **Step 3: Verify source configuration**

Run: `rg -n 'localhost:5173|CLIENT_ORIGIN' backend/src/index.js backend/lib/socket.js`

Expected: both files define the default and consume `CLIENT_ORIGIN`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/index.js backend/lib/socket.js
git commit -m "fix: configure API and socket CORS origin"
```

### Task 2: Add production container images

**Files:**
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`
- Create: `.dockerignore`

**Interfaces:**
- Consumes: the frontend/backend package lockfiles and source trees.
- Produces: backend on internal port 3000 and frontend Nginx on internal port 80.

- [ ] **Step 1: Create `backend/Dockerfile`**

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/index.js"]
```

- [ ] **Step 2: Create `frontend/Dockerfile`**

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

- [ ] **Step 3: Add the frontend SPA server**

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

- [ ] **Step 4: Add build exclusions**

Create `.dockerignore` containing:
```gitignore
**/node_modules
**/dist
.git
.env
.env.*
!.env.example
npm-debug.log*
```

- [ ] **Step 5: Build images**

Run: `docker build -t chat-backend-test ./backend` and `docker build -t chat-frontend-test ./frontend`

Expected: both images build successfully.

- [ ] **Step 6: Commit**

```bash
git add backend/Dockerfile frontend/Dockerfile frontend/nginx.conf .dockerignore
git commit -m "build: add production container images"
```

### Task 3: Compose runtime services and Caddy

**Files:**
- Create: `compose.yml`
- Create: `Caddyfile`
- Create: `.env.example`

**Interfaces:**
- Consumes: Task 2 images and variables in an untracked `.env`.
- Produces: one public Caddy service; private frontend, backend, and MongoDB services.

- [ ] **Step 1: Create Caddy routing**

```caddyfile
chat.yalina.io.vn {
  encode zstd gzip
  @backend path /api/* /socket.io/*
  reverse_proxy @backend backend:3000
  reverse_proxy frontend:80
}
```

- [ ] **Step 2: Create `compose.yml`**

Define `caddy`, `frontend`, `backend`, and `mongo`. Only `caddy` declares `80:80` and `443:443`. Set backend `NODE_ENV=production`, `CLIENT_ORIGIN=https://chat.yalina.io.vn`, and `MONGO_URL=mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongo:27017/chatapp?authSource=admin`. Add named `mongo_data`, `caddy_data`, and `caddy_config` volumes. Add a MongoDB healthcheck; do not add a MongoDB ports section.

- [ ] **Step 3: Create `.env.example`**

```dotenv
MONGO_INITDB_ROOT_USERNAME=change-me
MONGO_INITDB_ROOT_PASSWORD=change-me
JWT_SECRET=generate-a-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

- [ ] **Step 4: Validate Compose**

Run: `docker compose --env-file .env.example config`

Expected: valid Compose output; only Caddy publishes host ports.

- [ ] **Step 5: Start and inspect the local stack**

Run: `docker compose --env-file .env.example up --build -d` then `docker compose ps`

Expected: all four services run, MongoDB is healthy, and Caddy can reach both upstream services.

- [ ] **Step 6: Commit**

```bash
git add compose.yml Caddyfile .env.example
git commit -m "deploy: add Compose stack with Caddy and MongoDB"
```

### Task 4: Add deployment runbook and final verification

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: reproducible VPS deployment, update, diagnosis, and public verification instructions.

- [ ] **Step 1: Document prerequisites**

Document the A/AAAA DNS record for `chat.yalina.io.vn`, inbound TCP 80/443, Docker Engine with Compose plugin, cloning the repository, and copying `.env.example` to a secret `.env`.

- [ ] **Step 2: Document operations**

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f caddy
git pull
docker compose up -d --build
```

- [ ] **Step 3: Document verification and recovery**

```bash
curl -I https://chat.yalina.io.vn
docker compose logs --tail=100 backend
docker compose logs --tail=100 caddy
docker compose exec mongo mongosh --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin
```

Explain that MongoDB has no public host port and Caddy certificate errors normally indicate wrong DNS or blocked TCP 80/443.

- [ ] **Step 4: Run final checks**

Run: `docker compose --env-file .env.example config`, `npm run build --prefix frontend`, and `npm run lint --prefix frontend`.

Expected: valid Compose rendering plus successful frontend build and lint.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add VPS deployment runbook"
```

