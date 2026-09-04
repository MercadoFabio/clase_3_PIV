import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// URLs de los microservicios en la red interna de Docker Compose.
// Antes habia un BACKEND_URL unico. Ahora cada microservicio tiene
// su propia URL y su propio contenedor independiente.
// ---------------------------------------------------------------------------
const PEDIDOS_URL = process.env.PEDIDOS_URL || 'http://pedidos-service:8081';
const PAGOS_URL   = process.env.PAGOS_URL   || 'http://pagos-service:8082';

// ---------------------------------------------------------------------------
// Middleware de Logging en Vivo
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const start = Date.now();
  const timeStr = new Date().toLocaleTimeString('es-AR', { hour12: false });
  console.log(`[${timeStr}] [BFF :3000] 📥 Peticion entrante: ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const elapsed = Date.now() - start;
    console.log(`[${timeStr}] [BFF :3000] 📤 Respuesta enviada: ${req.method} ${req.originalUrl} -> Status ${res.statusCode} (${elapsed}ms)`);
  });

  // Cabecera informativa para que el frontend y los alumnos identifiquen al BFF
  res.setHeader('X-Handled-By', 'BFF-NodeJS-Express');
  next();
});

// ---------------------------------------------------------------------------
// 1. Endpoint Consolidado: GET /api/inicio
// ---------------------------------------------------------------------------
// Filminas 27-C, 35 y 36: Resuelve la pantalla combinada ejecutando un Fan-Out
// en paralelo hacia los microservicios de dominio (pedidos y pagos).
// Cada microservicio corre en su propio contenedor, lo que se puede ver en los
// logs de Docker: pedidos-service y pagos-service responden al mismo tiempo.
app.get('/api/inicio', async (req, res) => {
  const t0 = performance.now();
  console.log(`[BFF :3000] 🚀 [Fan-Out Paralelo] Consultando pedidos-service:8081/pedidos y pagos-service:8082/pagos al mismo tiempo...`);

  try {
    const [pedidosRes, pagosRes] = await Promise.all([
      fetch(`${PEDIDOS_URL}/pedidos`),
      fetch(`${PAGOS_URL}/pagos`),
    ]);

    if (!pedidosRes.ok || !pagosRes.ok) {
      throw new Error(`Upstream error: pedidos=${pedidosRes.status}, pagos=${pagosRes.status}`);
    }

    const pedidos = await pedidosRes.json();
    const pagos = await pagosRes.json();
    const elapsed = Math.round(performance.now() - t0);

    console.log(`[BFF :3000] 📦 [Fan-Out Exitoso] ${pedidos.length} pedidos y ${pagos.length} pagos recibidos en ${elapsed}ms. Cruzando datos para la UI...`);

    // Cruzar cada pedido con su estado de pago
    const pedidosConPago = pedidos.map((pedido) => {
      const pago = pagos.find((p) => p.pedidoId === pedido.id);
      return {
        ...pedido,
        pago: pago ? { estado: pago.estado, monto: pago.monto } : { estado: 'DESCONOCIDO', monto: 0 },
      };
    });

    const totalRecaudado = pagos
      .filter((p) => p.estado === 'PAGADO')
      .reduce((acc, p) => acc + p.monto, 0);

    res.json({
      titulo: 'Pizzeria Don Nginx - Panel de Control',
      resumen: {
        totalPedidos: pedidos.length,
        totalPagados: pagos.filter((p) => p.estado === 'PAGADO').length,
        totalPendientes: pagos.filter((p) => p.estado === 'PENDIENTE').length,
        recaudacionConfirmada: totalRecaudado,
      },
      pedidos: pedidosConPago,
      pagosPendientes: pagos.filter((p) => p.estado === 'PENDIENTE'),
      meta: {
        origen: 'BFF (Node.js/Express en puerto 3000)',
        consultasRealizadasEnParalelo: [
          `GET ${PEDIDOS_URL}/pedidos`,
          `GET ${PAGOS_URL}/pagos`,
        ],
        tiempoFanOutMs: elapsed,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`[BFF :3000] ❌ Error en Fan-Out:`, error.message);
    res.status(502).json({
      error: 'Error de comunicacion con los servicios backend',
      detalle: error.message,
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Endpoint Específico: GET /api/pedidos
// ---------------------------------------------------------------------------
// Permite que la pantalla de Pedidos consulte directamente a traves del BFF.
// El BFF consulta solo a pedidos-service:8081, sin tocar pagos-service.
app.get('/api/pedidos', async (req, res) => {
  console.log(`[BFF :3000] 🍕 Consultando pedidos-service:8081/pedidos...`);
  try {
    const upstreamRes = await fetch(`${PEDIDOS_URL}/pedidos`);
    const data = await upstreamRes.json();
    res.json({
      seccion: 'Listado de Pedidos',
      items: data,
      meta: { origen: `BFF -> pedidos-service (${PEDIDOS_URL})`, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// 3. Endpoint Específico: GET /api/pagos
// ---------------------------------------------------------------------------
// Permite que la pantalla de Pagos consulte directamente a traves del BFF.
// El BFF consulta solo a pagos-service:8082, sin tocar pedidos-service.
app.get('/api/pagos', async (req, res) => {
  console.log(`[BFF :3000] 💳 Consultando pagos-service:8082/pagos...`);
  try {
    const upstreamRes = await fetch(`${PAGOS_URL}/pagos`);
    const data = await upstreamRes.json();
    res.json({
      seccion: 'Listado de Pagos',
      items: data,
      meta: { origen: `BFF -> pagos-service (${PAGOS_URL})`, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'bff' });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡ [BFF] Node.js/Express iniciado en puerto ${PORT}`);
  console.log(`🍕 [BFF] Microservicio de pedidos: ${PEDIDOS_URL}`);
  console.log(`💳 [BFF] Microservicio de pagos:   ${PAGOS_URL}`);
  console.log(`=======================================================`);
});
