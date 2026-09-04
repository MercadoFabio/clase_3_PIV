# Clase 3: Arquitectura con Nginx, Docker y Patrón BFF

Material de clase y proyecto práctico interactivo para la cátedra de **Programación IV - Backend & Frontend** (UTN - Tecnicatura Universitaria en Programación).

---

## 📂 Contenido del Repositorio

| Recurso | Descripción |
|---|---|
| **[`01-nginx-arquitectura-portable.html`](./01-nginx-arquitectura-portable.html)** | Presentación interactiva Reveal.js portable (69 filminas auto-contenidas, sin dependencias externas). Cubre Cliente-Servidor, roles de Nginx, Gateway, Docker (VM vs Contenedor) y el patrón BFF. |
| **[`example/`](./example/)** | Proyecto práctico multi-contenedor listo para producción/clase con **Angular**, **Nginx**, **Node.js (BFF)** y **Spring Boot**. |

---

## 🏗️ Arquitectura del Ejemplo Práctico (`example/`)

El proyecto implementa la arquitectura de microservicios explicada en la clase (Pizzería Don Nginx), con una **única puerta de entrada pública** y servicios internos aislados:

```
                     NAVEGADOR WEB (Cliente)
                                │
                                │ Acceso único: http://localhost:4200
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ RED PRIVADA DE DOCKER                                                   │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ CONTENEDOR: frontend (Nginx 1.27 + Angular 21)                  │   │
│   │ - Puerto publicado en Host: 4200:80                             │   │
│   │ - Rol 1: Servidor web de estáticos (HTML/CSS/JS de Angular)     │   │
│   │ - Rol 2: Reverse Proxy hacia el BFF para toda ruta /api/*       │   │
│   └───────────────────────────────┬─────────────────────────────────┘   │
│                                   │                                     │
│          proxy_pass interno:      │ /api/inicio, /api/pedidos, /api/pagos
│          http://bff:3000          ▼                                     │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ CONTENEDOR: bff (Node.js 22 + Express)                          │   │
│   │ - Puerto interno: 3000 (Sin publicar en el Host)                │   │
│   │ - Rol: Backend for Frontend. Adapta los datos para la UI        │   │
│   │ - Ejecuta Fan-Out concurrente (Promise.all) hacia Spring Boot   │   │
│   └───────────────────────────────┬─────────────────────────────────┘   │
│                                   │                                     │
│          Fan-out interno:         │ http://backend:8080/pedidos         │
│          http://backend:8080      ▼ http://backend:8080/pagos           │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ CONTENEDOR: backend (Java 21 + Spring Boot 4)                   │   │
│   │ - Puerto interno: 8080 (Sin publicar en el Host)                │   │
│   │ - Rol: Microservicios de dominio (Pedidos y Pagos)              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Cómo Levantarlo

### Requisitos
* Docker y Docker Compose instalados.

### Ejecución
```bash
cd example
docker compose up --build
```

Luego abrir en el navegador:
👉 **<http://localhost:4200>**

Para detener los contenedores:
```bash
docker compose down
```

---

## 🎓 Demostración en Vivo para Clases

1. Abrí el navegador en **<http://localhost:4200>**:
   * Usá el **Navbar** para alternar entre:
     * 🏠 **Panel Consolidado (BFF `/api/inicio`)**: Vista con KPIs y pedidos cruzados con su estado de pago.
     * 📋 **Microservicio Pedidos (`/api/pedidos`)**: Vista directa de pedidos.
     * 💳 **Microservicio Pagos (`/api/pagos`)**: Vista directa de pagos.
   * Observá la **Consola de Trazas en Vivo** en la parte inferior de la pantalla con los tiempos de respuesta.
2. Abrí una terminal al lado con:
   ```bash
   cd example
   docker compose logs -f
   ```
   Al hacer clic en el frontend, se verá en vivo:
   * El log del **BFF** (`[BFF :3000]`) ejecutando el Fan-Out concurrente en milisegundos.
   * El log del **Backend** (`[BACKEND :8080]`) recibiendo las peticiones desde la red interna de Docker y despachando los datos.
