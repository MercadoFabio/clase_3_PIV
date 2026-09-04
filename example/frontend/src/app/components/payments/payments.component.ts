import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment } from '../../models/pizzeria.models';

/**
 * PaymentsComponent
 * 
 * Componente presentacional para el microservicio de pagos.
 * - Sigue Clean Architecture (Dumb/Presentational Component).
 * - Código y propiedades en inglés.
 * - Comentarios explicativos en español.
 */
@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent {
  @Input() items: Payment[] = [];
  @Output() refresh = new EventEmitter<void>();

  onRefresh(): void {
    this.refresh.emit();
  }
}
