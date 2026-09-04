import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
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
 * - Toda la lógica y nombres de propiedades/métodos están en inglés.
 * - Comentarios explicativos en español para docencia.
 * - Archivos separados: app.ts (lógica), app.html (template) y app.css (estilos).
 * - Delega la comunicación HTTP al servicio inyectado (PizzeriaService).
 * - NO usa Signals: maneja estado mediante propiedades estándar y RxJS subscriptions.
 * - Implementa OnDestroy para desuscribirse y evitar fugas de memoria.
 * - Descompone la interfaz en subcomponentes modulares (OrdersComponent, PaymentsComponent).
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, OrdersComponent, PaymentsComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  // Inyección de dependencias moderna mediante inject()
  private readonly pizzeriaService = inject(PizzeriaService);

  // Estado de la interfaz (sin signals)
  activeTab: 'dashboard' | 'orders' | 'payments' = 'dashboard';
  isLoading: boolean = false;

  dashboardData: DashboardResponse | null = null;
  ordersList: Order[] = [];
  paymentsList: Payment[] = [];
  logs: NetworkLogEntry[] = [];

  private logsSubscription?: Subscription;

  ngOnInit(): void {
    // Suscripción al stream reactivo de trazas de red
    this.logsSubscription = this.pizzeriaService.logs$.subscribe({
      next: (updatedLogs) => {
        this.logs = updatedLogs;
      }
    });

    // Carga la pestaña inicial
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    // Limpieza de suscripciones para evitar memory leaks
    this.logsSubscription?.unsubscribe();
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
    this.pizzeriaService.getDashboard().subscribe({
      next: (response) => {
        this.dashboardData = response.body;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener datos del dashboard:', err);
        this.isLoading = false;
      }
    });
  }

  loadOrders(): void {
    this.isLoading = true;
    this.pizzeriaService.getOrders().subscribe({
      next: (response) => {
        this.ordersList = response.body?.items || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener pedidos:', err);
        this.isLoading = false;
      }
    });
  }

  loadPayments(): void {
    this.isLoading = true;
    this.pizzeriaService.getPayments().subscribe({
      next: (response) => {
        this.paymentsList = response.body?.items || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener pagos:', err);
        this.isLoading = false;
      }
    });
  }

  clearLogs(): void {
    this.pizzeriaService.clearLogs();
  }
}
