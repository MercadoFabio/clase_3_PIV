/**
 * Modelos de dominio y contratos de datos para la aplicación.
 * 
 * Clean Code:
 * - Nombres de interfaces, propiedades y métodos estrictamente en inglés.
 * - Desacopla la lógica de presentación de la estructura de datos.
 */

export interface OrderPaymentStatus {
  estado: string;
  monto: number;
}

export interface Order {
  id: number;
  pizza: string;
  cantidad: number;
  pago?: OrderPaymentStatus;
}

export interface Payment {
  id: number;
  pedidoId: number;
  monto: number;
  estado: 'PAGADO' | 'PENDIENTE' | string;
}

export interface DashboardSummary {
  totalPedidos: number;
  totalPagados: number;
  totalPendientes: number;
  recaudacionConfirmada: number;
}

export interface DashboardResponse {
  titulo: string;
  resumen: DashboardSummary;
  pedidos: Order[];
  pagosPendientes: Payment[];
  meta?: {
    origen: string;
    consultasRealizadasEnParalelo: string[];
    tiempoFanOutMs: number;
    timestamp: string;
  };
}

export interface OrdersResponse {
  seccion: string;
  items: Order[];
  meta: {
    origen: string;
    timestamp: string;
  };
}

export interface PaymentsResponse {
  seccion: string;
  items: Payment[];
  meta: {
    origen: string;
    timestamp: string;
  };
}

export interface NetworkLogEntry {
  time: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  detail: string;
}
