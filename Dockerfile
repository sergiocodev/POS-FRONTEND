# ---- Etapa 1: Build Angular ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar dependencias e instalar (incluye devDependencies para el build)
COPY package*.json ./
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación Angular en modo producción
RUN npm run build

# ---- Etapa 2: Servidor de producción ----
FROM node:22-alpine

WORKDIR /app

# Copiar solo package.json para instalar únicamente dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el build generado en la etapa anterior
COPY --from=builder /app/dist ./dist

# Copiar el servidor Express
COPY server.js .

EXPOSE 8080

CMD ["node", "server.js"]
