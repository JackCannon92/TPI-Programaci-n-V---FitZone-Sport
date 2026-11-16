# Imagen de la API de FitZone Sports (ADR-009).
# Se construye desde docker-compose.yml; también sirve sola:
#   docker build -t fitzone-api Backend
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Primero las dependencias: si no cambia package-lock.json, Docker reutiliza esta capa.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# No correr como root dentro del contenedor.
USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]
