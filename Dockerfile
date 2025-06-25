# Usar Node.js 18 como base
FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY astro.config.mjs ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm ci --only=production

# Etapa de construcción
FROM base AS build

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 astro

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY astro.config.mjs ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar archivos construidos desde la etapa de build
COPY --from=build --chown=astro:nodejs /app/dist ./dist
COPY --from=build --chown=astro:nodejs /app/dist/server ./dist/server

# Cambiar al usuario no-root
USER astro

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Comando para ejecutar la aplicación
CMD ["node", "./dist/server/entry.mjs"] 