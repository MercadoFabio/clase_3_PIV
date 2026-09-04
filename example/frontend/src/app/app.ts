import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component, signal, OnInit } from '@angular/core';

type LogItem = {
  time: string;
  metodo: string;
  url: string;
  status: number;
  duracionMs: number;
  detalle: string;
};

@Component({
  selector: 'app-root',
  imports: [],
  template: `
    <div class="app-container">
      <!-- Header / Branding -->
      <header class="header">
        <div class="brand">
          <span class="logo">🍕</span>
          <div>
            <h1>Pizzería Don Nginx</h1>
            <p class="subtitle">Arquitectura de Microservicios con <strong>BFF (Backend for Frontend)</strong></p>
          </div>
        </div>
        <div class="infra-badge">
          <span class="dot"></span> Nginx :4200 &rarr; BFF :3000 &rarr; Backend :8080
        </div>
      </header>

      <!-- Navbar interactivo -->
      <nav class="navbar">
        <button 
          class="nav-btn" 
          [class.active]="tabActiva() === 'inicio'"
          (click)="cambiarTab('inicio')">
          🏠 Panel Consolidado (BFF /api/inicio)
        </button>
        <button 
          class="nav-btn" 
          [class.active]="tabActiva() === 'pedidos'"
          (click)="cambiarTab('pedidos')">
          📋 Microservicio Pedidos (/api/pedidos)
        </button>
        <button 
          class="nav-btn" 
          [class.active]="tabActiva() === 'pagos'"
          (click)="cambiarTab('pagos')">
          💳 Microservicio Pagos (/api/pagos)
        </button>
      </nav>

      <!-- Contenido de las Tabs -->
      <main class="content-area">
        @if (cargando()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Consultando al BFF a través de Nginx...</p>
          </div>
        } @else {
          <!-- TAB 1: INICIO (BFF) -->
          @if (tabActiva() === 'inicio' && datosInicio(); as data) {
            <section class="section-card">
              <div class="bff-banner">
                <span class="bff-icon">⚡</span>
                <div>
                  <strong>Patrón BFF en acción:</strong> El navegador hizo <em>una sola llamada</em> a <code>/api/inicio</code>.
                  El BFF ejecutó un <strong>Fan-Out en paralelo</strong> hacia <code>/pedidos</code> y <code>/pagos</code> en Spring Boot,
                  combinó los datos en <strong>{{ data.meta?.tiempoFanOutMs }}ms</strong> y entregó esta vista lista para renderizar.
                </div>
              </div>

              <!-- KPIs / Resumen -->
              <div class="kpi-grid">
                <div class="kpi-card">
                  <span class="kpi-label">Total Pedidos</span>
                  <span class="kpi-value">{{ data.resumen?.totalPedidos }}</span>
                </div>
                <div class="kpi-card green">
                  <span class="kpi-label">Pagados</span>
                  <span class="kpi-value">{{ data.resumen?.totalPagados }}</span>
                </div>
                <div class="kpi-card amber">
                  <span class="kpi-label">Pendientes</span>
                  <span class="kpi-value">{{ data.resumen?.totalPendientes }}</span>
                </div>
                <div class="kpi-card purple">
                  <span class="kpi-label">Recaudación Confirmada</span>
                  <span class="kpi-value">\${{ data.resumen?.recaudacionConfirmada?.toLocaleString('es-AR') }}</span>
                </div>
              </div>

              <!-- Listado de pedidos cruzados con estado de pago -->
              <h3>Pedidos y Estado de Pago Consolidado</h3>
              <div class="cards-grid">
                @for (pedido of data.pedidos; track pedido.id) {
                  <div class="item-card">
                    <div class="item-header">
                      <span class="item-id">Pedido #{{ pedido.id }}</span>
                      <span class="badge" [class.badge-green]="pedido.pago.estado === 'PAGADO'" [class.badge-amber]="pedido.pago.estado === 'PENDIENTE'">
                        {{ pedido.pago.estado }}
                      </span>
                    </div>
                    <div class="item-body">
                      <h4>{{ pedido.pizza }}</h4>
                      <p class="item-qty">Cantidad: <strong>x{{ pedido.cantidad }}</strong></p>
                      <p class="item-price">Monto: <strong>\${{ pedido.pago.monto?.toLocaleString('es-AR') }}</strong></p>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- TAB 2: PEDIDOS -->
          @if (tabActiva() === 'pedidos' && datosPedidos(); as data) {
            <section class="section-card">
              <div class="view-header">
                <div>
                  <h2>Microservicio de Pedidos</h2>
                  <p class="view-sub">Datos obtenidos a través de la ruta <code>/api/pedidos</code> intermediada por el BFF</p>
                </div>
                <button class="btn-refresh" (click)="cargarPedidos()">🔄 Refrescar</button>
              </div>

              <div class="cards-grid">
                @for (item of data.items; track item.id) {
                  <div class="item-card">
                    <div class="item-header">
                      <span class="item-id">#{{ item.id }}</span>
                      <span class="badge badge-blue">Servicio: Pedidos</span>
                    </div>
                    <div class="item-body">
                      <h4>{{ item.pizza }}</h4>
                      <p class="item-qty">Unidades: <strong>x{{ item.cantidad }}</strong></p>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- TAB 3: PAGOS -->
          @if (tabActiva() === 'pagos' && datosPagos(); as data) {
            <section class="section-card">
              <div class="view-header">
                <div>
                  <h2>Microservicio de Pagos</h2>
                  <p class="view-sub">Datos de facturación obtenidos desde <code>/api/pagos</code> intermediados por el BFF</p>
                </div>
                <button class="btn-refresh" (click)="cargarPagos()">🔄 Refrescar</button>
              </div>

              <div class="cards-grid">
                @for (item of data.items; track item.id) {
                  <div class="item-card">
                    <div class="item-header">
                      <span class="item-id">Pago #{{ item.id }}</span>
                      <span class="badge" [class.badge-green]="item.estado === 'PAGADO'" [class.badge-amber]="item.estado === 'PENDIENTE'">
                        {{ item.estado }}
                      </span>
                    </div>
                    <div class="item-body">
                      <p>Asociado a: <strong>Pedido #{{ item.pedidoId }}</strong></p>
                      <h4 style="color: #111827; margin-top: 0.5rem;">\${{ item.monto?.toLocaleString('es-AR') }}</h4>
                    </div>
                  </div>
                }
              </div>
            </section>
          }
        }
      </main>

      <!-- Visor de Logs de Interacción en Vivo -->
      <aside class="live-console">
        <div class="console-header">
          <div class="console-title">
            <span class="rec-dot"></span>
            <strong>Trazas de Red en Vivo (Frontend &rarr; Nginx &rarr; BFF &rarr; Backend)</strong>
          </div>
          <div class="console-actions">
            <span class="log-count">{{ logs().length }} eventos</span>
            <button class="btn-clear" (click)="limpiarLogs()">Limpiar</button>
          </div>
        </div>
        <div class="console-body">
          @for (log of logs(); track log.time) {
            <div class="log-row">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-method">{{ log.metodo }}</span>
              <span class="log-url">{{ log.url }}</span>
              <span class="log-status" [class.status-200]="log.status === 200">{{ log.status }} OK</span>
              <span class="log-duration">{{ log.duracionMs }}ms</span>
              <span class="log-detail">{{ log.detalle }}</span>
            </div>
          } @empty {
            <div class="log-empty">Hacé clic en las pestañas del navbar para ver las peticiones pasar por el BFF y Backend en tiempo real...</div>
          }
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .app-container {
      max-width: 58rem;
      margin: 1.5rem auto;
      padding: 0 1rem 3rem 1rem;
      font-family: system-ui, -apple-system, sans-serif;
      color: #1f2937;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .logo {
      font-size: 2.4rem;
    }
    .header h1 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .subtitle {
      margin: 0.2rem 0 0 0;
      font-size: 0.9rem;
      color: #6b7280;
    }
    .infra-badge {
      font-size: 0.8rem;
      font-family: monospace;
      background: #1e293b;
      color: #f8fafc;
      padding: 0.4rem 0.8rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }

    /* Navbar */
    .navbar {
      display: flex;
      gap: 0.5rem;
      background: #f1f5f9;
      padding: 0.4rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .nav-btn {
      flex: 1;
      min-width: 160px;
      background: transparent;
      border: none;
      padding: 0.65rem 1rem;
      border-radius: 7px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }
    .nav-btn:hover {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.6);
    }
    .nav-btn.active {
      background: #ffffff;
      color: #7c3aed;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Content Area */
    .section-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      margin-bottom: 1.5rem;
    }
    .bff-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      border-radius: 8px;
      padding: 0.85rem 1rem;
      font-size: 0.92rem;
      color: #5b21b6;
      line-height: 1.45;
      margin-bottom: 1.5rem;
    }
    .bff-icon {
      font-size: 1.4rem;
      line-height: 1;
    }

    /* KPIs */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .kpi-card.green { border-left: 4px solid #10b981; }
    .kpi-card.amber { border-left: 4px solid #f59e0b; }
    .kpi-card.purple { border-left: 4px solid #8b5cf6; }
    .kpi-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
    }

    /* Cards Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }
    .item-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      background: #ffffff;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .item-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .item-id {
      font-size: 0.8rem;
      font-family: monospace;
      color: #64748b;
    }
    .badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-amber { background: #fef3c7; color: #b45309; }
    .badge-blue  { background: #e0f2fe; color: #0369a1; }
    .item-body h4 {
      margin: 0.25rem 0 0.5rem 0;
      font-size: 1.1rem;
      color: #0f172a;
    }
    .item-qty, .item-price {
      margin: 0.2rem 0;
      font-size: 0.85rem;
      color: #475569;
    }

    .view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .view-header h2 {
      margin: 0;
      font-size: 1.3rem;
      color: #111827;
    }
    .view-sub {
      margin: 0.2rem 0 0 0;
      font-size: 0.85rem;
      color: #64748b;
    }
    .btn-refresh {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      color: #334155;
    }
    .btn-refresh:hover { background: #e2e8f0; }

    /* Live Console */
    .live-console {
      background: #0f172a;
      color: #f8fafc;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .console-header {
      background: #1e293b;
      padding: 0.6rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #334155;
    }
    .console-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.82rem;
      color: #cbd5e1;
    }
    .rec-dot {
      width: 9px;
      height: 9px;
      background: #ef4444;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .console-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .log-count {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .btn-clear {
      background: #334155;
      color: #cbd5e1;
      border: none;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.72rem;
      cursor: pointer;
    }
    .btn-clear:hover { background: #475569; color: #fff; }
    .console-body {
      padding: 0.75rem 1rem;
      max-height: 220px;
      overflow-y: auto;
      font-size: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .log-row {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 0.35rem;
      flex-wrap: wrap;
    }
    .log-time { color: #64748b; }
    .log-method { color: #38bdf8; font-weight: 700; }
    .log-url { color: #fbbf24; }
    .log-status { color: #a3e635; font-weight: 700; }
    .log-duration { color: #c084fc; }
    .log-detail { color: #cbd5e1; font-size: 0.75rem; }
    .log-empty {
      color: #64748b;
      font-style: italic;
      padding: 1rem 0;
      text-align: center;
    }

    /* Loading */
    .loading-state {
      padding: 3rem;
      text-align: center;
      color: #64748b;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #7c3aed;
      border-radius: 50%;
      margin: 0 auto 1rem auto;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class App implements OnInit {
  protected readonly tabActiva = signal<'inicio' | 'pedidos' | 'pagos'>('inicio');
  protected readonly cargando = signal<boolean>(false);

  protected readonly datosInicio = signal<any>(null);
  protected readonly datosPedidos = signal<any>(null);
  protected readonly datosPagos = signal<any>(null);
  protected readonly logs = signal<LogItem[]>([]);

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.cargarInicio();
  }

  cambiarTab(tab: 'inicio' | 'pedidos' | 'pagos') {
    this.tabActiva.set(tab);
    if (tab === 'inicio' && !this.datosInicio()) this.cargarInicio();
    if (tab === 'pedidos') this.cargarPedidos();
    if (tab === 'pagos') this.cargarPagos();
  }

  cargarInicio() {
    this.ejecutarLlamada('/api/inicio', 'BFF combinó /pedidos y /pagos en paralelo', (res) => {
      this.datosInicio.set(res);
    });
  }

  cargarPedidos() {
    this.ejecutarLlamada('/api/pedidos', 'BFF consultó microservicio de pedidos en Spring Boot', (res) => {
      this.datosPedidos.set(res);
    });
  }

  cargarPagos() {
    this.ejecutarLlamada('/api/pagos', 'BFF consultó microservicio de pagos en Spring Boot', (res) => {
      this.datosPagos.set(res);
    });
  }

  limpiarLogs() {
    this.logs.set([]);
  }

  private ejecutarLlamada(url: string, detalle: string, onExito: (data: any) => void) {
    this.cargando.set(true);
    const t0 = performance.now();
    const timeStr = new Date().toLocaleTimeString('es-AR', { hour12: false });

    console.log(`%c[FRONTEND Angular] 🚀 GET ${url} -> Enviando a Nginx...`, 'color: #38bdf8; font-weight: bold;');

    this.http.get(url, { observe: 'response' }).subscribe({
      next: (resp: HttpResponse<any>) => {
        const duracion = Math.round(performance.now() - t0);
        this.cargando.set(false);
        onExito(resp.body);

        const logEntry: LogItem = {
          time: timeStr,
          metodo: 'GET',
          url,
          status: resp.status,
          duracionMs: duracion,
          detalle: `${detalle} (${duracion}ms)`,
        };

        this.logs.update((items) => [logEntry, ...items].slice(0, 20));
        console.log(`%c[FRONTEND Angular] ✅ ${url} completado en ${duracion}ms [Status ${resp.status}]`, 'color: #10b981; font-weight: bold;', resp.body);
      },
      error: (err) => {
        const duracion = Math.round(performance.now() - t0);
        this.cargando.set(false);
        const logEntry: LogItem = {
          time: timeStr,
          metodo: 'GET',
          url,
          status: err.status || 500,
          duracionMs: duracion,
          detalle: `Error: ${err.message}`,
        };
        this.logs.update((items) => [logEntry, ...items].slice(0, 20));
        console.error(`%c[FRONTEND Angular] ❌ Error en ${url}:`, 'color: #ef4444; font-weight: bold;', err);
      }
    });
  }
}
