import { NgClass, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-notification-message',
    standalone: true,
    imports: [NgClass, NgIf],
    templateUrl: './notification-message-component.component.html',
    styleUrl: './notification-message-component.component.scss'
})
export class NotificationMessageComponent implements OnInit {
    @Input() type: string = ''; // 'success', 'error', 'warning'
    @Input() message: string = '';
    @Output() show = new EventEmitter<boolean>();

    isVisible: boolean = true;

    ngOnInit(): void {
        setTimeout(() => {
            this.closeNotification();
        }, 2000); // 2 seconds for better readability
    }

    closeNotification(): void {
        this.isVisible = false;
        this.show.emit(false);
    }

    get notificationClass(): string {
        switch (this.type) {
            case 'success': return 'notification-success';
            case 'error': return 'notification-error';
            case 'warning': return 'notification-warning';
            default: return '';
        }
    }

    get iconClass(): string {
        switch (this.type) {
            case 'success': return 'bi bi-check-circle-fill';
            case 'error': return 'bi bi-x-circle-fill';
            case 'warning': return 'bi bi-exclamation-triangle-fill';
            default: return '';
        }
    }

    get title(): string {
        switch (this.type) {
            case 'success': return 'Correcto';
            case 'error': return 'Error';
            case 'warning': return 'Advertencia';
            default: return '';
        }
    }
}
