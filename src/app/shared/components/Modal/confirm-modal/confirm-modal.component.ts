import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenericModalComponent } from '../generic-modal/generic-modal.component';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule, GenericModalComponent],
    templateUrl: './confirm-modal.component.html',
    styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent {
    @Input() isOpen = false;
    @Input() title = 'Confirmar acción';
    @Input() message = '¿Estás seguro de que deseas continuar?';
    @Input() confirmText = 'Confirmar';
    @Input() cancelText = 'Cancelar';
    @Input() type: 'danger' | 'primary' | 'warning' = 'primary';

    @Output() confirm = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    onConfirm() {
        this.confirm.emit();
    }

    onCancel() {
        this.cancel.emit();
    }
}
