import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// URLs de los microservicios en la red interna de Docker Compose.
// ---------------------------------------------------------------------------
const PEDIDOS_URL = process.env.PEDIDOS_URL || 'http://pedidos-service:8081';
const PAGOS_URL   = process.env.PAGOS_URL   || 'http://pagos-service:8082';

// ---------------------------------------------------------------------------
// Middleware: Desactivar caché HTTP y registrar logs en vivo
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const start = Date.now();
  const timeStr = new Date().toLocaleTimeString('es-AR', { hour12: false });
  console.log(`[${timeStr}] [BFF :3000] 📥 Peticion entrante: ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const elapsed = Date.now() - start;
    console.log(`[${timeStr}] [BFF :3000] 📤 Respuesta enviada: ${req.method} ${req.originalUrl} -> Status ${res.statusCode} (${elapsed}ms)`);
  });

  // Desactivar cualquier caché en el navegador
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Handled-By', 'BFF-NodeJS-Express');

  next();
});

// ---------------------------------------------------------------------------
// 1. Endpoint Consolidado: GET /api/inicio (Fan-Out paralelo)
// ---------------------------------------------------------------------------
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
      const pagoAsociado = pagos.find((pago) => pago.pedidoId === pedido.id);
      return {
        ...pedido,
        pago: pagoAsociado
          ? { estado: pagoAsociado.estado, monto: pagoAsociado.monto }
          : { estado: 'DESCONOCIDO', monto: 0 },
      };
    });

    const pagosConfirmados = pagos.filter((p) => p.estado === 'PAGADO');
    const recaudacionConfirmada = pagosConfirmados.reduce((sum, p) => sum + p.monto, 0);

    const respuestaParaFrontend = {
      titulo: 'Pizzeria Don Nginx - Panel de Control',
      resumen: {
        totalPedidos: pedidos.length,
        totalPagados: pagosConfirmados.length,
        totalPendientes: pagos.filter((p) => p.estado === 'PENDIENTE').length,
        recaudacionConfirmada,
      },
      pedidos: pedidosConPago,
      pagosPendientes: pagos.filter((p) => p.estado === 'PENDIENTE'),
      meta: {
        origen: 'BFF (Node.js/Express en puerto 3000)',
        consultasRealizadasEnParalelo: [
          `${PEDIDOS_URL}/pedidos`,
          `${PAGOS_URL}/pagos`,
        ],
        tiempoFanOutMs: elapsed,
        timestamp: new Date().toISOString(),
      },
    };

    res.json(respuestaParaFrontend);
  } catch (error) {
    console.error(`[BFF :3000] ❌ Error en Fan-Out:`, error.message);
    res.status(502).json({
      error: 'Error al consultar los microservicios aguas abajo',
      detalle: error.message,
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Proxy simple hacia el microservicio de Pedidos
// ---------------------------------------------------------------------------
app.get('/api/pedidos', async (req, res) => {
  try {
    console.log(`[BFF :3000] ➡️ Reenviando a ${PEDIDOS_URL}/pedidos...`);
    const upstreamRes = await fetch(`${PEDIDOS_URL}/pedidos`);
    if (!upstreamRes.ok) throw new Error(`Status ${upstreamRes.status}`);
    const data = await upstreamRes.json();

    res.json({
      seccion: 'Listado de Pedidos',
      items: data,
      meta: {
        origen: `BFF -> pedidos-service (${PEDIDOS_URL})`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`[BFF :3000] ❌ Error en /api/pedidos:`, error.message);
    res.status(502).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// 3. Proxy simple hacia el microservicio de Pagos
// ---------------------------------------------------------------------------
app.get('/api/pagos', async (req, res) => {
  try {
    console.log(`[BFF :3000] ➡️ Reenviando a ${PAGOS_URL}/pagos...`);
    const upstreamRes = await fetch(`${PAGOS_URL}/pagos`);
    if (!upstreamRes.ok) throw new Error(`Status ${upstreamRes.status}`);
    const data = await upstreamRes.json();

    res.json({
      seccion: 'Listado de Pagos',
      items: data,
      meta: {
        origen: `BFF -> pagos-service (${PAGOS_URL})`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`[BFF :3000] ❌ Error en /api/pagos:`, error.message);
    res.status(502).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡ [BFF] Node.js/Express iniciado en puerto ${PORT}`);
  console.log(`🍕 [BFF] Microservicio de pedidos: ${PEDIDOS_URL}`);
  console.log(`💳 [BFF] Microservicio de pagos:   ${PAGOS_URL}`);
  console.log(`=======================================================`);
});
