import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
 * - Comentarios pedagógicos en español.
 * - Sin Signals, sin Subject ni BehaviorSubject.
 * - Inyecta ChangeDetectorRef para garantizar que Angular actualice la vista
 *   inmediatamente cuando los datos lleguen desde el stream asíncrono.
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
  private readonly cdr = inject(ChangeDetectorRef);

  activeTab: 'dashboard' | 'orders' | 'payments' = 'dashboard';

  isDashboardLoading: boolean = false;
  isOrdersLoading: boolean = false;
  isPaymentsLoading: boolean = false;

  dashboardData: DashboardResponse | null = null;
  ordersList: Order[] = [];
  paymentsList: Payment[] = [];
  logs: NetworkLogEntry[] = [];

  ngOnInit(): void {
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
    this.isDashboardLoading = true;
    const startTime = performance.now();
    const endpoint = '/api/inicio';

    this.pizzeriaService.getDashboard().subscribe({
      next: (response) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.dashboardData = response.body;
        this.isDashboardLoading = false;
        this.addLog('GET', endpoint, response.status, durationMs, `BFF Fan-Out consolidado (${durationMs}ms)`);
        this.cdr.detectChanges();
      },
      error: (error) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.isDashboardLoading = false;
        this.addLog('GET', endpoint, error.status || 500, durationMs, `Error: ${error.message}`);
        this.cdr.detectChanges();
        console.error('Error loading dashboard:', error);
      }
    });
  }

  loadOrders(): void {
    this.isOrdersLoading = true;
    const startTime = performance.now();
    const endpoint = '/api/pedidos';

    this.pizzeriaService.getOrders().subscribe({
      next: (response) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.ordersList = response.body?.items || [];
        this.isOrdersLoading = false;
        this.addLog('GET', endpoint, response.status, durationMs, `Microservicio pedidos-service :8081 (${durationMs}ms)`);
        this.cdr.detectChanges();
      },
      error: (error) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.isOrdersLoading = false;
        this.addLog('GET', endpoint, error.status || 500, durationMs, `Error: ${error.message}`);
        this.cdr.detectChanges();
        console.error('Error loading orders:', error);
      }
    });
  }

  loadPayments(): void {
    this.isPaymentsLoading = true;
    const startTime = performance.now();
    const endpoint = '/api/pagos';

    this.pizzeriaService.getPayments().subscribe({
      next: (response) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.paymentsList = response.body?.items || [];
        this.isPaymentsLoading = false;
        this.addLog('GET', endpoint, response.status, durationMs, `Microservicio pagos-service :8082 (${durationMs}ms)`);
        this.cdr.detectChanges();
      },
      error: (error) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.isPaymentsLoading = false;
        this.addLog('GET', endpoint, error.status || 500, durationMs, `Error: ${error.message}`);
        this.cdr.detectChanges();
        console.error('Error loading payments:', error);
      }
    });
  }

  clearLogs(): void {
    this.logs = [];
    this.cdr.detectChanges();
  }

  private addLog(method: string, url: string, status: number, durationMs: number, detail: string): void {
    const time = new Date().toLocaleTimeString('es-AR', { hour12: false });
    const newEntry: NetworkLogEntry = { time, method, url, status, durationMs, detail };
    this.logs = [newEntry, ...this.logs].slice(0, 25);
  }
}
