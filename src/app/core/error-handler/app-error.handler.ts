import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ModalService } from '../../shared/components/confirm-modal/service/modal.service';

/**
 * Global error handler for the application.
 * Catches all unhandled exceptions and displays a user-friendly notification.
 * In production, this should also report to a monitoring service (Sentry, etc.).
 */
@Injectable()
export class AppErrorHandler implements ErrorHandler {
    private modalService = inject(ModalService, { optional: true });

    handleError(error: unknown): void {
        const message = this.extractMessage(error);

        // Log to console for developers
        console.error('[AppErrorHandler]', error);

        // Ignorable errors that shouldn't trigger a popup
        const ignoreWords = ['ResizeObserver', 'play() request was interrupted', 'user didn\'t interact', 'Cannot read properties of null (reading \'videoWidth\')', 'video source', 'AudioContext'];
        if (ignoreWords.some(w => message.includes(w))) {
            return;
        }

        // Show user-friendly notification for runtime errors
        if (this.modalService && typeof window !== 'undefined') {
            this.modalService.alert({
                title: 'Ha ocurrido un error',
                message: `Se produjo un error inesperado: ${message}`,
                type: 'error'
            });
        }

        // Re-throw so Angular still logs it and the app doesn't silently fail
        if (error instanceof Error) {
            throw error;
        }
    }

    private extractMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return String(error);
    }
}
