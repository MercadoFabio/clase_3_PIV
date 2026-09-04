# Build en dos etapas: Node compila el proyecto, pero no viaja a la imagen final.

# ---------------------------------------------------------------------------
# Etapa 1: Existe solo durante el build y despues se descarta.
# ---------------------------------------------------------------------------

# Arranca desde la imagen oficial de Node 22 sobre Alpine (una distro de Linux
# minima) y le pone de nombre "build" a esta etapa, para poder referenciarla mas abajo.
FROM node:22-alpine AS build

# Fija /app como directorio de trabajo adentro del contenedor: todos los comandos
# que siguen (COPY, RUN) se ejecutan parados ahi. Si no existe, lo crea.
WORKDIR /app

# Copia solo package.json y package-lock.json desde la carpeta del Dockerfile
# hacia el directorio actual del contenedor (el "./" final es /app).
# Van primero y solos porque Docker cachea cada instruccion: mientras estos dos
# archivos no cambien, reutiliza el resultado del npm ci de la linea siguiente.
COPY package.json package-lock.json ./

# Ejecuta npm ci, que instala las dependencias exactas del package-lock.json.
# Es la version de npm install pensada para builds automatizados: no toca el lock.
RUN npm ci

# Ahora si copia el resto del proyecto (src/, angular.json, tsconfig, etc.) a /app.
# Lo que este listado en .dockerignore queda afuera, node_modules incluido.
COPY . .

# Corre el script "build" del package.json, que es "ng build".
# Genera el bundle compilado en /app/dist/frontend/browser.
RUN npm run build

# ---------------------------------------------------------------------------
# Etapa 2: La imagen que corre en produccion. Empieza de cero.
# ---------------------------------------------------------------------------

# Segundo FROM: descarta todo lo de la etapa anterior y arranca de nuevo desde
# la imagen oficial de Nginx sobre Alpine. Node y node_modules quedan afuera.
FROM nginx:alpine

# La linea clave del multi-stage: copia una carpeta desde la etapa "build"
# (--from=build) en vez de desde la maquina. Trae /app/dist/frontend/browser,
# que es lo compilado, hacia /usr/share/nginx/html, que es la carpeta desde la
# que Nginx sirve archivos por defecto.
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copia nuestro nginx.conf (que esta al lado del Dockerfile) sobre el archivo de
# configuracion por defecto de la imagen, reemplazandolo.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# No hace falta un CMD: la imagen de Nginx ya trae el suyo y arranca el servidor.
