# Pizzería Don Nginx — Ejemplo práctico

Ejemplo mínimo de la infraestructura de la Unidad 3: Nginx sirve el build de Angular
y, al mismo tiempo, hace de **API Gateway** hacia un **BFF (Backend for Frontend)** en Node.js,
que a su vez consulta a dos **microservicios Spring Boot independientes** — tal como muestra
la arquitectura de la Pizzería Don Nginx en las diapositivas.

## Levantarlo

```bash
docker compose up --build
```

Después, abrir <http://localhost:4200>. La pantalla de inicio muestra los pedidos
consolidados con su estado de pago, combinados por el BFF en una sola llamada.

Para parar todo: `Ctrl+C` y `docker compose down`.

## Para mostrar en vivo a los alumnos

Abrí dos ventanas al dar la clase para que vean la traza completa:

1. **Navegador**: En <http://localhost:4200>, cambiá entre las pestañas **Inicio**, **Pedidos** y **Pagos**. En la parte inferior de la pantalla tenés una **consola de trazas en vivo** que muestra cada llamada y su duración en milisegundos.
2. **Terminal con logs en vivo**:
   ```bash
   docker compose logs -f
   ```
   Al hacer clic en el frontend, se ve en vivo cuatro servicios respondiendo:
   - `[BFF :3000]` ejecutando el Fan-Out en paralelo hacia los dos microservicios.
   - `[pedidos-service :8081]` recibiendo el `GET /pedidos` y despachando los datos.
   - `[pagos-service :8082]` recibiendo el `GET /pagos` y despachando los datos.

## Arquitectura — Como viaja una solicitud

```
Navegador → localhost:4200
                 │
           Nginx (port 80)
           ├── /              ──► Angular SPA (archivos estáticos)
           └── /api/*         ──► BFF :3000
                                      │
                                      ├── GET /api/inicio (fan-out paralelo)
                                      │     ├── pedidos-service:8081/pedidos
                                      │     └── pagos-service:8082/pagos
                                      │
                                      ├── GET /api/pedidos ──► pedidos-service:8081
                                      └── GET /api/pagos   ──► pagos-service:8082

        Red interna Docker (invisible desde el navegador):
        ├── bff                :3000
        ├── pedidos-service    :8081
        └── pagos-service      :8082
```

- `GET /` → Nginx devuelve `index.html` y los estáticos del build de Angular.
- `GET /api/inicio` → Nginx lo reenvía al **BFF** (`http://bff:3000/api/inicio`), que consulta en paralelo a `pedidos-service:8081` y `pagos-service:8082`, unifica la información y entrega la respuesta lista para la pantalla (patrón de las filminas 27-C, 35 y 36).
- `GET /api/pedidos` → Nginx lo reenvía al BFF, que consulta solo a `pedidos-service:8081`.
- `GET /api/pagos` → Nginx lo reenvía al BFF, que consulta solo a `pagos-service:8082`.

`bff`, `pedidos-service` y `pagos-service` son nombres de servicio en `docker-compose.yml`:
dentro de la red interna de Docker funcionan como nombres de host. Desde el navegador esos
nombres no existen, y sus puertos tampoco están publicados hacia el exterior. Por eso el
frontend pide `/api/...` al origen de Nginx (puerto 4200).

## Archivos que importan

| Archivo | Qué hace |
| --- | --- |
| `frontend/nginx.conf` | API Gateway: rutea `/api/*` al BFF y `/` al Angular build. |
| `bff/src/index.js` | BFF en Node.js/Express: fan-out paralelo hacia los dos microservicios. |
| `bff/Dockerfile` | Imagen liviana de Node.js Alpine para ejecutar el BFF. |
| `frontend/Dockerfile` | Build en dos etapas: Node compila Angular, la imagen final solo lleva Nginx. |
| `pedidos-service/src/.../PedidosApplication.java` | Microservicio Spring Boot en port 8081: solo `/pedidos`. |
| `pagos-service/src/.../PagosApplication.java` | Microservicio Spring Boot en port 8082: solo `/pagos`. |
| `pedidos-service/Dockerfile` | Multi-stage: Maven compila, imagen final lleva el JRE y el `.jar`. |
| `pagos-service/Dockerfile` | Idéntico patrón para pagos. |
| `docker-compose.yml` | Orquesta 4 servicios en una red privada, con Nginx como única puerta al exterior. |
| `frontend/src/app/app.ts` | Toda la app Angular: navbar con 3 tabs y consola de trazas en vivo. |

## El contraejemplo: servir sin Nginx

`frontend/Dockerfile.node` no lo usa el compose. Está ahí para mostrar qué
pasa cuando se reemplaza Nginx por un servidor de estáticos de Node:

```bash
cd frontend
docker build -f Dockerfile.node -t frontend-node .
docker run --rm -p 3000:3000 frontend-node
```

En <http://localhost:3000> la aplicación carga, pero la lista de pedidos queda
vacía: no hay proxy inverso, así que `/api/pedidos` nunca llega al backend.
El detalle interesante es que tampoco da 404 — devuelve el `index.html` con
`content-type: text/html`, y el frontend falla al intentar parsearlo como JSON.
Además la imagen pesa 179 MB contra los 53 MB de la que usa Nginx.

## Cómo se generó

Todo con los CLIs oficiales, sin plantillas a mano:

```bash
npx @angular/cli@21 new frontend --minimal --style=css --routing=false --ssr=false \
  --inline-template --inline-style --skip-git --ai-config=none

# Dos microservicios independientes generados desde Spring Initializr:
curl https://start.spring.io/starter.zip -d type=maven-project -d language=java \
  -d bootVersion=4.1.0 -d javaVersion=21 -d dependencies=web \
  -d groupId=ar.edu.utn.tup -d artifactId=pedidos-service -o pedidos-service.zip

curl https://start.spring.io/starter.zip -d type=maven-project -d language=java \
  -d bootVersion=4.1.0 -d javaVersion=21 -d dependencies=web \
  -d groupId=ar.edu.utn.tup -d artifactId=pagos-service -o pagos-service.zip
```
