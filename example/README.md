# Ejemplo: Docker + Nginx + Angular + BFF (Node.js) + Spring Boot

Ejemplo minimo de la infraestructura de la Unidad 3: Nginx sirve el build de Angular
y, al mismo tiempo, hace de proxy inverso y gateway hacia un **BFF (Backend for Frontend)**
y hacia el backend Spring Boot. El navegador solo conoce a Nginx.

## Levantarlo

```bash
docker compose up --build
```

Despues, abrir <http://localhost:4200>. La pantalla de inicio muestra los pedidos
consolidados con su estado de pago, combinados por el BFF en una sola llamada.

Para parar todo: `Ctrl+C` y `docker compose down`.

## Para mostrar en vivo a los alumnos

Abrí dos ventanas al dar la clase para que vean la traza completa:

1. **Navegador**: En <http://localhost:4200>, cambiá entre las pestañas **Inicio**, **Pedidos** y **Pagos**. En la parte inferior de la pantalla tenés una **consola de trazas en vivo** que muestra cada llamada y su duración en milisegundos.
2. **Terminal con logs en vivo**:
   ```bash
   docker compose logs -f
   ```
   Al hacer clic en el frontend, se ve en vivo:
   - `[BFF :3000]` ejecutando el Fan-Out en paralelo hacia los microservicios.
   - `[BACKEND :8080]` recibiendo las llamadas desde la IP interna del BFF y despachando los datos.

## Como viaja una solicitud

```
navegador  ->  localhost:4200  ->  Nginx  ->  archivos estaticos (Angular)
                                        \->  bff:3000/api/inicio  ->  backend:8080/pedidos
                                        \                         \->  backend:8080/pagos
                                         \->  backend:8080        para /api/pedidos
```

- `GET /` → Nginx devuelve `index.html` y los estaticos del build de Angular.
- `GET /api/inicio` → Nginx lo reenvia al **BFF** (`http://bff:3000/api/inicio`), que consulta en paralelo a los microservicios (`/pedidos` y `/pagos`), unifica la informacion y entrega la respuesta lista para la pantalla (patron de las filminas 27-C, 35 y 36).
- `GET /api/pedidos` → Nginx lo reenvia directamente a `http://backend:8080/pedidos`.

`bff` y `backend` son nombres de servicio en `docker-compose.yml`: dentro de la red
interna de Docker funcionan como nombres de host. Desde el navegador esos nombres no
existen, y sus puertos tampoco estan publicados hacia el exterior. Por eso el frontend
pide `/api/...` al origen de Nginx (puerto 4200).

## Archivos que importan

| Archivo | Que hace |
| --- | --- |
| `frontend/nginx.conf` | Servidor web y proxy inverso: rutea `/api/inicio` al BFF y `/api/` al backend. |
| `bff/src/index.js` | El BFF en Node.js/Express: hace fan-out en paralelo y compone la respuesta de la pantalla. |
| `bff/Dockerfile` | Imagen liviana de Node.js Alpine para ejecutar el BFF. |
| `frontend/Dockerfile` | Build en dos etapas: Node compila, la imagen final solo lleva Nginx. |
| `backend/Dockerfile` | Mismo patron: Maven compila, la imagen final solo lleva el JRE y el `.jar`. |
| `docker-compose.yml` | Orquesta los tres servicios en una red privada, con Nginx como unica puerta al exterior. |
| `frontend/src/app/app.ts` | Toda la app Angular: consume `/api/inicio` y renderiza los datos combinados. |
| `backend/.../BackendApplication.java` | Endpoints de dominio `/pedidos` y `/pagos` en Spring Boot. |
| `frontend/Dockerfile.node` | Contraejemplo: la misma app servida sin Nginx. |

## El contraejemplo: servir sin Nginx

`frontend/Dockerfile.node` no lo usa el compose. Esta ahi para mostrar que
pasa cuando se reemplaza Nginx por un servidor de estaticos de Node:

```bash
cd frontend
docker build -f Dockerfile.node -t frontend-node .
docker run --rm -p 3000:3000 frontend-node
```

En <http://localhost:3000> la aplicacion carga, pero la lista de pedidos queda
vacia: no hay proxy inverso, asi que `/api/pedidos` nunca llega al backend.
El detalle interesante es que tampoco da 404 — devuelve el `index.html` con
`content-type: text/html`, y el frontend falla al intentar parsearlo como JSON.
Ademas la imagen pesa 179 MB contra los 53 MB de la que usa Nginx.

## Correrlo sin Docker (para desarrollo)

```bash
# terminal 1
cd backend && ./mvnw spring-boot:run

# terminal 2
cd frontend && npm start
```

Ojo: asi no hay Nginx en el medio, y `/api/pedidos` da 404. Para desarrollo habria
que configurar un proxy en `angular.json`; en este ejemplo el punto es justamente
que en produccion ese trabajo lo hace Nginx.

## Como se genero

Todo con los CLIs oficiales, sin plantillas a mano:

```bash
npx @angular/cli@21 new frontend --minimal --style=css --routing=false --ssr=false \
  --inline-template --inline-style --skip-git --ai-config=none

curl https://start.spring.io/starter.zip -d type=maven-project -d language=java \
  -d bootVersion=4.1.0 -d javaVersion=21 -d dependencies=web \
  -d groupId=ar.edu.utn.tup -d artifactId=backend -o backend.zip
```
