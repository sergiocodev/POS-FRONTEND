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

  @Input() max: number = Infinity;
  @Input() allowManual: boolean = true;
  @Input() showControls: boolean = true;
  @Input() disabled: boolean = false;

  @Output() valueChange = new EventEmitter<number>();

  increment() {
    const nextValue = parseFloat((Number(this.value) + Number(this.step)).toFixed(2));
    if (nextValue > this.max) {
      this.emitChange(this.max);
    } else {
      this.emitChange(nextValue);
    }
  }

  decrement() {
    let prevValue = parseFloat((Number(this.value) - Number(this.step)).toFixed(2));
    if (prevValue < this.min) {
      prevValue = this.min;
    }
    this.emitChange(prevValue);
  }

  onManualInput(event: Event) {
    if (!this.allowManual) return;

    const target = event.target as HTMLInputElement;
    let val = parseFloat(target.value);

    if (!isNaN(val)) {
      if (val > this.max) val = this.max;
      if (val < this.min) val = this.min;
      this.emitChange(val);
    } else {
      this.emitChange(this.min);
    }
  }

  private emitChange(newValue: number) {
    this.value = newValue;
    this.valueChange.emit(this.value);
  }
}
