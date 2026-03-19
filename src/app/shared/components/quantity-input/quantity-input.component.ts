import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-quantity-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quantity-input.component.html',
  styleUrl: './quantity-input.component.scss',
})
export class QuantityInputComponent {
  @Input() label: string = 'Cantidad';
  @Input() value: number = 0;
  @Input() min: number = 0;
  @Input() step: number = 1;

  // NUEVO: Controla si se puede digitar manualmente o solo usar botones
  @Input() allowManual: boolean = true;

  @Output() valueChange = new EventEmitter<number>();

  increment() {
    const nextValue = parseFloat((Number(this.value) + Number(this.step)).toFixed(2));
    this.emitChange(nextValue);
  }

  decrement() {
    let prevValue = parseFloat((Number(this.value) - Number(this.step)).toFixed(2));
    if (prevValue < this.min) {
      prevValue = this.min;
    }
    this.emitChange(prevValue);
  }

  onManualInput(event: Event) {
    // Si no está permitido el ingreso manual, ignoramos el evento por seguridad
    if (!this.allowManual) return;

    const target = event.target as HTMLInputElement;
    const val = parseFloat(target.value);

    if (!isNaN(val)) {
      this.emitChange(val < this.min ? this.min : val);
    } else {
      this.emitChange(this.min);
    }
  }

  private emitChange(newValue: number) {
    this.value = newValue;
    this.valueChange.emit(this.value);
  }
}
