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
 * Clean Code & Arquitectura:
 * - Toda la lógica y nombres en inglés.
 * - Comentarios explicativos en español para docencia.
 * - Archivos separados: app.ts (lógica), app.html (template) y app.css (estilos).
 * - Delega la comunicación HTTP al servicio inyectado (PizzeriaService).
 * - NO usa Signals, NO usa BehaviorSubject, NO usa Subject.
 * - Maneja el estado local directamente en propiedades estándar de TypeScript.
 * - Descompone la interfaz en subcomponentes modulares (OrdersComponent, PaymentsComponent).
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, OrdersComponent, PaymentsComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  // Inyección de dependencias moderna mediante inject()
  private readonly pizzeriaService = inject(PizzeriaService);

  // Estado de la interfaz mediante propiedades estándar de TypeScript
  activeTab: 'dashboard' | 'orders' | 'payments' = 'dashboard';
  isLoading: boolean = false;

  dashboardData: DashboardResponse | null = null;
  ordersList: Order[] = [];
  paymentsList: Payment[] = [];
  logs: NetworkLogEntry[] = [];

  ngOnInit(): void {
    // Carga de la pestaña inicial
    this.loadDashboard();
  }

  switchTab(tab: 'dashboard' | 'orders' | 'payments'): void {
    this.activeTab = tab;
    if (tab === 'dashboard' && !this.dashboardData) {
      this.loadDashboard();
    } else if (tab === 'orders' && this.ordersList.length === 0) {
      this.loadOrders();
    } else if (tab === 'payments' && this.paymentsList.length === 0) {
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
        console.error('Error loading dashboard:', error);
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
        console.error('Error loading orders:', error);
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
        console.error('Error loading payments:', error);
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
