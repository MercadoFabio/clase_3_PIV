# ---------------------------------------------------------------------------
# BFF (Backend For Frontend) - Imagen minima sobre Node 22 Alpine
# ---------------------------------------------------------------------------

# Arranca desde la imagen oficial de Node 22 sobre Alpine Linux (liviana y rapida).
FROM node:22-alpine

# Fija /app como directorio de trabajo adentro del contenedor.
WORKDIR /app

# Copia los archivos de definicion de paquetes primero para aprovechar la cache de Docker.
COPY package.json package-lock.json* ./

# Instala las dependencias de produccion (express).
# Si existe package-lock.json corre npm ci, si no corre npm install.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copia el codigo fuente del BFF a la imagen.
COPY src ./src

# Informa que el contenedor escucha en el puerto 3000.
EXPOSE 3000

# Comando para iniciar el BFF:
CMD ["node", "src/index.js"]
