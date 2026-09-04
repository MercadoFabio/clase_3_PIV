import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, Subject, merge, scan, map, tap, catchError, throwError } from 'rxjs';
import { 
  DashboardResponse, 
  OrdersResponse, 
  PaymentsResponse, 
  NetworkLogEntry 
} from '../models/pizzeria.models';

/**
 * PizzeriaService
 * 
 * Clean Code & Arquitectura Reactiva Funcional:
 * - Toda la lógica y nombres en inglés.
 * - Comentarios didácticos en español.
 * - Desacopla la vista de la capa HTTP.
 * - NO usa BehaviorSubject ni Signals.
 * - Emplea programación reactiva con operadores RxJS puros (Subject + merge + scan)
 *   donde el estado acumulado de logs es un Observable inmutable producido por un stream de eventos.
 */
@Injectable({
  providedIn: 'root'
})
export class PizzeriaService {
  private readonly http = inject(HttpClient);

  // Stream de eventos: nuevos logs individuales
  private readonly newLog$ = new Subject<NetworkLogEntry>();

  // Stream de eventos: comando de reseteo / limpieza
  private readonly clearLogs$ = new Subject<'CLEAR'>();

  /**
   * Observable derivado con el operador funcional `scan`:
   * Combina la llegada de nuevos logs o la señal de limpieza acumulando
   * el arreglo de manera inmutable, sin estado mutable ni BehaviorSubject.
   */
  public readonly logs$: Observable<NetworkLogEntry[]> = merge(
    this.newLog$.pipe(map(log => ({ type: 'ADD' as const, payload: log }))),
    this.clearLogs$.pipe(map(() => ({ type: 'CLEAR' as const })))
  ).pipe(
    scan((accumulatedLogs: NetworkLogEntry[], action) => {
      if (action.type === 'CLEAR') {
        return [];
      }
      return [action.payload, ...accumulatedLogs].slice(0, 25);
    }, [] as NetworkLogEntry[])
  );

  /**
   * Consulta al BFF la vista consolidada de inicio (fan-out en el backend)
   */
  getDashboard(): Observable<HttpResponse<DashboardResponse>> {
    const endpoint = '/api/inicio';
    const startTime = performance.now();

    return this.http.get<DashboardResponse>(endpoint, { observe: 'response' }).pipe(
      tap((response) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.emitLog('GET', endpoint, response.status, durationMs, `BFF Fan-Out consolidado (${durationMs}ms)`);
      }),
      catchError((error) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.emitLog('GET', endpoint, error.status || 500, durationMs, `Error: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Consulta al microservicio pedidos-service :8081 a través del BFF
   */
  getOrders(): Observable<HttpResponse<OrdersResponse>> {
    const endpoint = '/api/pedidos';
    const startTime = performance.now();

    return this.http.get<OrdersResponse>(endpoint, { observe: 'response' }).pipe(
      tap((response) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.emitLog('GET', endpoint, response.status, durationMs, `Microservicio pedidos-service :8081 (${durationMs}ms)`);
      }),
      catchError((error) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.emitLog('GET', endpoint, error.status || 500, durationMs, `Error: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Consulta al microservicio pagos-service :8082 a través del BFF
   */
  getPayments(): Observable<HttpResponse<PaymentsResponse>> {
    const endpoint = '/api/pagos';
    const startTime = performance.now();

    return this.http.get<PaymentsResponse>(endpoint, { observe: 'response' }).pipe(
      tap((response) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.emitLog('GET', endpoint, response.status, durationMs, `Microservicio pagos-service :8082 (${durationMs}ms)`);
      }),
      catchError((error) => {
        const durationMs = Math.round(performance.now() - startTime);
        this.emitLog('GET', endpoint, error.status || 500, durationMs, `Error: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Emite la señal de vaciado de logs al pipeline reactivo
   */
  clearLogs(): void {
    this.clearLogs$.next('CLEAR');
  }

  private emitLog(method: string, url: string, status: number, durationMs: number, detail: string): void {
    const time = new Date().toLocaleTimeString('es-AR', { hour12: false });
    this.newLog$.next({ time, method, url, status, durationMs, detail });
  }
}
