import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// Definimos los tamaños permitidos para ayudar al autocompletado
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'app-modal-generic',
  imports: [CommonModule],
  templateUrl: './modal-generic.component.html',
  styleUrl: './modal-generic.component.scss',
})
export class ModalGenericComponent {
  @Input() title: string = '';
  @Input() isVisible: boolean = false;

  @Input() size: ModalSize = 'md';

  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }
}
