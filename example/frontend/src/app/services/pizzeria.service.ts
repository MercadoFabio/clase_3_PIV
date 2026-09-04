import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, delay } from 'rxjs';
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
 * - Aplica el operador RxJS `delay(500)` para que la respuesta simule
 *   la latencia natural de red y el usuario/alumno pueda apreciar con claridad
 *   el spinner y la transición suave en pantalla.
 */
@Injectable({
  providedIn: 'root'
})
export class PizzeriaService {
  private readonly http = inject(HttpClient);
  
  // Retraso artificial pedagógico de 500ms usando el operador puro de RxJS
  private readonly SIMULATED_DELAY_MS = 500;

  /**
   * Obtiene la vista consolidada de inicio desde el BFF (ejecuta fan-out en el backend).
   */
  getDashboard(): Observable<HttpResponse<DashboardResponse>> {
    return this.http.get<DashboardResponse>('/api/inicio', { observe: 'response' }).pipe(
      delay(this.SIMULATED_DELAY_MS)
    );
  }

  /**
   * Consulta el listado de pedidos al microservicio pedidos-service :8081 vía BFF.
   */
  getOrders(): Observable<HttpResponse<OrdersResponse>> {
    return this.http.get<OrdersResponse>('/api/pedidos', { observe: 'response' }).pipe(
      delay(this.SIMULATED_DELAY_MS)
    );
  }

  /**
   * Consulta el listado de pagos al microservicio pagos-service :8082 vía BFF.
   */
  getPayments(): Observable<HttpResponse<PaymentsResponse>> {
    return this.http.get<PaymentsResponse>('/api/pagos', { observe: 'response' }).pipe(
      delay(this.SIMULATED_DELAY_MS)
    );
  }
}
