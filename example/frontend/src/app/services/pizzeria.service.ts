import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  DashboardResponse, 
  OrdersResponse, 
  PaymentsResponse 
} from '../models/pizzeria.models';

/**
 * PizzeriaService
 * 
 * Clean Code & Arquitectura:
 * - Código y nombres en inglés.
 * - Comentarios pedagógicos en español.
 * - Desacopla la lógica de transporte HTTP de los componentes.
 * - NO usa Signals, NO usa BehaviorSubject, NO usa Subject.
 * - Es un servicio con métodos que devuelven Observables puros de HttpClient.
 */
@Injectable({
  providedIn: 'root'
})
export class PizzeriaService {
  // Inyección de dependencias moderna mediante inject()
  private readonly http = inject(HttpClient);

  /**
   * Obtiene la vista consolidada de inicio desde el BFF (ejecuta fan-out en el backend).
   * Devuelve un Observable puro de HttpClient.
   */
  getDashboard(): Observable<HttpResponse<DashboardResponse>> {
    return this.http.get<DashboardResponse>('/api/inicio', { observe: 'response' });
  }

  /**
   * Consulta el listado de pedidos al microservicio pedidos-service :8081 vía BFF.
   */
  getOrders(): Observable<HttpResponse<OrdersResponse>> {
    return this.http.get<OrdersResponse>('/api/pedidos', { observe: 'response' });
  }

  /**
   * Consulta el listado de pagos al microservicio pagos-service :8082 vía BFF.
   */
  getPayments(): Observable<HttpResponse<PaymentsResponse>> {
    return this.http.get<PaymentsResponse>('/api/pagos', { observe: 'response' });
  }
}
