import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PizzeriaService } from './services/pizzeria.service';
import { OrdersComponent } from './components/orders/orders.component';
import { PaymentsComponent } from './components/payments/payments.component';
import { 
  DashboardResponse, 
  Order, 
  Payment, 
  NetworkLogEntry 
} from './models/pizzeria.models';

/**
 * App (Root Component)
 * 
 * Flujo simple y transparente para clase:
 * - Al hacer clic en una pestaña siempre consulta al backend en vivo.
 * - Sin caché en memoria ni comprobaciones de listas vacías.
 * - Registro directo en la consola de trazas.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, OrdersComponent, PaymentsComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  private readonly pizzeriaService = inject(PizzeriaService);

  activeTab: 'dashboard' | 'orders' | 'payments' = 'dashboard';

  isLoading: boolean = false;
  dashboardData: DashboardResponse | null = null;
  ordersList: Order[] = [];
  paymentsList: Payment[] = [];
  logs: NetworkLogEntry[] = [];

  ngOnInit(): void {
    this.loadDashboard();
  }

  switchTab(tab: 'dashboard' | 'orders' | 'payments'): void {
    this.activeTab = tab;
    // Siempre pide los datos al backend para mostrar la interacción en vivo
    if (tab === 'dashboard') {
      this.loadDashboard();
    } else if (tab === 'orders') {
      this.loadOrders();
    } else if (tab === 'payments') {
      this.loadPayments();
    }
  }

  loadDashboard(): void {
    this.isLoading = true;
    const startTime = performance.now();
    const endpoint = '/api/inicio';

    this.pizzeriaService.getDashboard().subscribe({
      next: (response) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.dashboardData = response.body;
        this.isLoading = false;
        this.addLog('GET', endpoint, response.status, durationMs, `BFF Fan-Out consolidado (${durationMs}ms)`);
      },
      error: (error) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.isLoading = false;
        this.addLog('GET', endpoint, error.status || 500, durationMs, `Error: ${error.message}`);
      }
    });
  }

  loadOrders(): void {
    this.isLoading = true;
    const startTime = performance.now();
    const endpoint = '/api/pedidos';

    this.pizzeriaService.getOrders().subscribe({
      next: (response) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.ordersList = response.body?.items || [];
        this.isLoading = false;
        this.addLog('GET', endpoint, response.status, durationMs, `Microservicio pedidos-service :8081 (${durationMs}ms)`);
      },
      error: (error) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.isLoading = false;
        this.addLog('GET', endpoint, error.status || 500, durationMs, `Error: ${error.message}`);
      }
    });
  }

  loadPayments(): void {
    this.isLoading = true;
    const startTime = performance.now();
    const endpoint = '/api/pagos';

    this.pizzeriaService.getPayments().subscribe({
      next: (response) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.paymentsList = response.body?.items || [];
        this.isLoading = false;
        this.addLog('GET', endpoint, response.status, durationMs, `Microservicio pagos-service :8082 (${durationMs}ms)`);
      },
      error: (error) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.isLoading = false;
        this.addLog('GET', endpoint, error.status || 500, durationMs, `Error: ${error.message}`);
      }
    });
  }

  clearLogs(): void {
    this.logs = [];
  }

  private addLog(method: string, url: string, status: number, durationMs: number, detail: string): void {
    const time = new Date().toLocaleTimeString('es-AR', { hour12: false });
    const newEntry: NetworkLogEntry = { time, method, url, status, durationMs, detail };
    this.logs = [newEntry, ...this.logs].slice(0, 25);
  }
}
