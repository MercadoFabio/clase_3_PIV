import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../models/pizzeria.models';

/**
 * OrdersComponent
 * 
 * Componente presentacional para el microservicio de pedidos.
 * - Sigue Clean Architecture (Dumb/Presentational Component).
 * - Recibe isLoading para mostrar un spinner suave en lugar de parpadeos bruscos.
 */
@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent {
  @Input() items: Order[] = [];
  @Input() isLoading: boolean = false;
  @Output() refresh = new EventEmitter<void>();

  onRefresh(): void {
    this.refresh.emit();
  }
}
