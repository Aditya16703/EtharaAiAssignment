# ── Stage 1: Build the React app ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Layer cache: install deps first
COPY package*.json ./
RUN npm ci

# Build args for environment variables baked into the bundle
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

COPY . .
RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx site
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx runs as root inside alpine by default — fine for containers
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/api/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
