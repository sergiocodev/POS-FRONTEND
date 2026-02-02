import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';

@Component({
    selector: 'app-alert-status-operation',
    standalone: true,
    imports: [NgClass, NgIf],
    templateUrl: './alert-status-operation.component.html',
    styleUrl: './alert-status-operation.component.scss'
})
export class AlertStatusOperationComponent {
    @Input() type: string = '';
    @Input() message: string = '';
    @Output() show = new EventEmitter<boolean>();

    isVisible: boolean = true;

    closeAlert() {
        this.isVisible = false;
        this.show.emit(false);
    }

    showAlert() {
        this.isVisible = true;
        this.show.emit(true);
    }

    get alertClass() {
        return {
            'alert-error': this.type === 'error',
            'alert-success': this.type === 'success',
            'alert-warning': this.type === 'warning',
        };
    }

    get iconClass() {
        switch (this.type) {
            case 'error': return 'bi bi-x-circle-fill';
            case 'success': return 'bi bi-check-circle-fill';
            case 'warning': return 'bi bi-exclamation-triangle-fill';
            default: return '';
        }
    }

    get alertTitle() {
        switch (this.type) {
            case 'error': return 'Error!';
            case 'success': return 'Success!';
            case 'warning': return 'Warning!';
            default: return '';
        }
    }
}
