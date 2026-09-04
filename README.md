# Clase 3: Arquitectura con Nginx, Docker y Patrón BFF

Material de clase y proyecto práctico interactivo para la cátedra de **Programación IV - Backend & Frontend** (UTN - Tecnicatura Universitaria en Programación).

---

## 📂 Contenido del Repositorio

| Recurso | Descripción |
|---|---|
| **[`01-nginx-arquitectura-portable.html`](./01-nginx-arquitectura-portable.html)** | Presentación interactiva Reveal.js portable (69 filminas, sin dependencias externas). Cubre Cliente-Servidor, roles de Nginx, Gateway, Docker (VM vs Contenedor) y el patrón BFF. |
| **[`example/`](./example/)** | Proyecto práctico multi-contenedor listo para clase: **Angular + Nginx (Gateway) + Node.js (BFF) + 2 microservicios Spring Boot**. |

### 📽️ Presentación de la clase

La presentación también está disponible online:

- **Link público:** <https://nginx-arquitectura-tup.netlify.app/>
- **Carga local:** [01-nginx-arquitectura-portable.html](./01-nginx-arquitectura-portable.html)

---

## 🏗️ Arquitectura del Ejemplo Práctico (`example/`)

El proyecto implementa la **Pizzería Don Nginx** de las diapositivas: Nginx como API Gateway, un BFF para agregar datos, y **dos microservicios Spring Boot independientes**, cada uno en su propio contenedor.

```
                     NAVEGADOR WEB (Cliente)
                                │
                                │  Único punto de entrada: http://localhost:4200
                                ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ RED PRIVADA DE DOCKER COMPOSE                                              │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  CONTENEDOR: frontend  —  Nginx 1.27 + Angular 21                   │  │
│  │  Puerto publicado al host: 4200 → 80                                │  │
│  │                                                                      │  │
│  │  Rol 1 · Servidor web:   GET /        → archivos estáticos Angular  │  │
│  │  Rol 2 · API Gateway:    GET /api/*   → proxy_pass http://bff:3000  │  │
│  └────────────────────────────────┬─────────────────────────────────────┘  │
│                                   │  /api/inicio  /api/pedidos  /api/pagos  │
│                                   ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  CONTENEDOR: bff  —  Node.js 22 + Express                           │  │
│  │  Puerto interno: 3000 (no publicado al host)                        │  │
│  │                                                                      │  │
│  │  GET /api/inicio   → Fan-Out paralelo (Promise.all)                 │  │
│  │                          ├── pedidos-service:8081/pedidos           │  │
│  │                          └── pagos-service:8082/pagos               │  │
│  │  GET /api/pedidos  → pedidos-service:8081/pedidos                   │  │
│  │  GET /api/pagos    → pagos-service:8082/pagos                       │  │
│  └──────────────┬──────────────────────────────┬────────────────────────┘  │
│                 │                              │                           │
│                 ▼                              ▼                           │
│  ┌──────────────────────────┐  ┌──────────────────────────┐               │
│  │ CONTENEDOR: pedidos-svc  │  │ CONTENEDOR: pagos-svc    │               │
│  │ Java 21 + Spring Boot 4  │  │ Java 21 + Spring Boot 4  │               │
│  │ Puerto interno: 8081     │  │ Puerto interno: 8082     │               │
│  │ GET /pedidos             │  │ GET /pagos               │               │
│  └──────────────────────────┘  └──────────────────────────┘               │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Cómo Levantarlo (En tu PC o en otra nueva)

### Requisitos

* **Docker Desktop** abierto y funcionando (Linux containers).

---

### Opción A — 1 Clic (Windows)

El repositorio incluye scripts listos para usar sin escribir comandos:

1. **`iniciar-proyecto.bat`** → doble clic y levanta los 4 contenedores automáticamente.
   La app queda en: 👉 **<http://localhost:4200>**

2. **`compartir-en-vivo.bat`** → doble clic y genera una **URL pública con HTTPS al instante**.
   Si `cloudflared.exe` no está, el script **lo descarga solo** y abre el túnel. Te muestra el link para compartir con los alumnos.

---

### Opción B — Consola

```bash
cd example
docker compose up --build
```

> La primera vez tarda ~3-5 minutos porque Maven descarga las dependencias de Spring Boot.
> Las siguientes veces usa caché de Docker y arranca en segundos.

Abrir: 👉 **<http://localhost:4200>**

Para detener todo:
```bash
docker compose down
```

---

## 🎓 Demostración en Vivo para Clases

### Qué abrir en el proyector

Abrí **dos ventanas lado a lado**:

**Ventana 1 — Navegador en <http://localhost:4200>**

Usá el Navbar para alternar entre las 3 secciones:

| Tab | Ruta | Qué muestra |
|-----|------|-------------|
| 🏠 Inicio | `GET /api/inicio` | Panel consolidado: BFF llama a los **dos microservicios en paralelo** y cruza pedidos con pagos |
| 📋 Pedidos | `GET /api/pedidos` | BFF → `pedidos-service:8081` únicamente |
| 💳 Pagos | `GET /api/pagos` | BFF → `pagos-service:8082` únicamente |

La **consola de trazas** en la parte inferior muestra cada llamada y su duración en ms.

**Ventana 2 — Terminal con logs en vivo**

```bash
cd example
docker compose logs -f
```

Al hacer clic en "Inicio", los alumnos ven la traza completa en tiempo real:

```
bff              | [BFF :3000] 🚀 [Fan-Out Paralelo] Consultando pedidos-service:8081 y pagos-service:8082...
pedidos-service  | 🍕 [pedidos-service :8081] GET /pedidos solicitado por 172.20.0.4 → Despachando 3 pedidos
pagos-service    | 💳 [pagos-service :8082] GET /pagos solicitado por 172.20.0.4 → Despachando 3 pagos
bff              | [BFF :3000] 📦 [Fan-Out Exitoso] 3 pedidos y 3 pagos recibidos en 24ms
```

---

## 📁 Estructura de Archivos

```
clase_3/
├── 01-nginx-arquitectura-portable.html  ← Presentación (abrir con doble clic)
├── iniciar-proyecto.bat                 ← Levanta todo con 1 clic
├── compartir-en-vivo.bat                ← Túnel HTTPS público con Cloudflare
└── example/
    ├── docker-compose.yml               ← Orquesta los 4 contenedores
    ├── frontend/                        ← Nginx + Angular build
    │   ├── Dockerfile                   ← Build multi-stage: Node → Nginx
    │   ├── nginx.conf                   ← Gateway + proxy hacia BFF
    │   └── src/app/app.ts               ← App Angular (navbar + consola de trazas)
    ├── bff/                             ← Backend for Frontend (Node.js + Express)
    │   ├── Dockerfile
    │   └── src/index.js                 ← Fan-out, logging, endpoints /api/*
    ├── pedidos-service/                 ← Microservicio de pedidos (Spring Boot :8081)
    │   ├── Dockerfile
    │   ├── pom.xml
    │   └── src/.../PedidosApplication.java
    └── pagos-service/                   ← Microservicio de pagos (Spring Boot :8082)
        ├── Dockerfile
        ├── pom.xml
        └── src/.../PagosApplication.java
```

---

## 🧪 Verificar que todo funciona

```bash
# Ver el estado de los 4 contenedores
docker compose ps

# Probar los endpoints directamente
curl http://localhost:4200/api/inicio
curl http://localhost:4200/api/pedidos
curl http://localhost:4200/api/pagos
```
