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
 * Simple y directo:
 * - Realiza las peticiones HTTP a la API Gateway (Nginx -> BFF).
 * - No usa caché, no usa delays artificiales, no usa Subjects ni Signals.
 * - Devuelve directamente el Observable de HttpClient.
 */
@Injectable({
  providedIn: 'root'
})
export class PizzeriaService {
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<HttpResponse<DashboardResponse>> {
    return this.http.get<DashboardResponse>('/api/inicio', { observe: 'response' });
  }

  getOrders(): Observable<HttpResponse<OrdersResponse>> {
    return this.http.get<OrdersResponse>('/api/pedidos', { observe: 'response' });
  }

  getPayments(): Observable<HttpResponse<PaymentsResponse>> {
    return this.http.get<PaymentsResponse>('/api/pagos', { observe: 'response' });
  }
}
