import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../models/pizzeria.models';

/**
 * OrdersComponent
 * 
 * Componente presentacional para el microservicio de pedidos.
 * - Sigue Clean Architecture (Dumb/Presentational Component).
 * - Código y propiedades en inglés.
 * - Comentarios explicativos en español.
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
  @Output() refresh = new EventEmitter<void>();

  onRefresh(): void {
    this.refresh.emit();
  }
}
