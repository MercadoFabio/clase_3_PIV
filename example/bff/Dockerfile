# El BFF no se compila: es JavaScript que Node ejecuta tal cual. Por eso este
# Dockerfile tiene una sola etapa, a diferencia del frontend (que tiene que
# correr "ng build") y del backend (que tiene que empaquetar un .jar). No hay
# nada que descartar despues del build, asi que no hay un segundo FROM.

# ---------------------------------------------------------------------------
# Imagen unica: Node 22 sobre Alpine.
# ---------------------------------------------------------------------------

# Arranca desde la imagen oficial de Node 22 sobre Alpine, la misma distro de
# Linux minima que usa la etapa de build del frontend.
FROM node:22-alpine

# Fija /app como directorio de trabajo adentro del contenedor: todos los
# comandos que siguen (COPY, RUN) se ejecutan parados ahi. Si no existe, lo crea.
WORKDIR /app

# Copia solo package.json y package-lock.json hacia el directorio actual (/app).
# Van primero y solos porque Docker cachea cada instruccion: mientras estos dos
# archivos no cambien, reutiliza el resultado del npm ci de la linea siguiente.
# El asterisco hace opcional al lock: si no estuviera, el COPY no falla.
COPY package.json package-lock.json* ./

# Instala las dependencias (aca, solo express).
# npm ci instala las versiones exactas del package-lock.json y es la variante
# pensada para builds automatizados: no toca el lock. El fallback a npm install
# existe por si el lock no llego, que es el caso que habilita el asterisco de
# arriba. --omit=dev deja afuera las dependencias de desarrollo, que en una
# imagen que solo tiene que ejecutar no hacen mas que ocupar lugar.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Ahora si copia el codigo del BFF a /app/src.
# Lo que este listado en .dockerignore queda afuera, node_modules incluido.
COPY src ./src

# EXPOSE es documentacion: le avisa a quien lee el archivo en que puerto escucha
# el proceso. No abre ni publica nada, igual que el "expose" del compose. Y en
# este caso es a proposito: el 3000 nunca se publica al host, porque al BFF solo
# se llega desde adentro de la red de Docker, con Nginx haciendo de proxy. Es la
# diferencia con el frontend, que si mapea "4200:80" y es la unica puerta publica.
EXPOSE 3000

# Comando con el que arranca el contenedor: levanta el servidor Express.
# En formato lista, node se ejecuta directamente, sin una shell en el medio.
CMD ["node", "src/index.js"]
