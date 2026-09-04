import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment } from '../../models/pizzeria.models';

/**
 * PaymentsComponent
 * 
 * Componente presentacional para el microservicio de pagos.
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
  @Input() isLoading: boolean = false;
  @Output() refresh = new EventEmitter<void>();

  onRefresh(): void {
    this.refresh.emit();
  }
}
