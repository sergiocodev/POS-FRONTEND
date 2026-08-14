// modal.service.ts
import { Injectable, signal } from '@angular/core';

export interface ConfirmModalConfig {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    btnColor?: string;
}

export interface AlertModalConfig {
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning';
    buttonText?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    // Datos reactivos para controlar el modal de confirmación
    readonly isVisible = signal<boolean>(false);
    readonly config = signal<ConfirmModalConfig>({
        title: '',
        message: ''
    });

    // Datos reactivos para controlar el modal de alerta
    readonly alertIsVisible = signal<boolean>(false);
    readonly alertConfig = signal<AlertModalConfig>({
        title: '',
        message: '',
        type: 'success',
        buttonText: 'OK'
    });

    // Promesas para devolver la respuesta
    private resolveRef?: (value: boolean) => void;
    private resolveAlertRef?: () => void;

    // --- CONFIRMATION MODAL ---

    confirm(config: ConfirmModalConfig): Promise<boolean> {
        this.config.set(config);
        this.isVisible.set(true); // Abre el modal

        // Retorna una promesa que se resuelve cuando el usuario hace clic
        return new Promise<boolean>((resolve) => {
            this.resolveRef = resolve;
        });
    }

    close(result: boolean) {
        this.isVisible.set(false);
        if (this.resolveRef) {
            this.resolveRef(result);
            this.resolveRef = undefined;
        }
    }

    // --- ALERT MODAL ---

    alert(config: AlertModalConfig): Promise<void> {
        this.alertConfig.set({
            ...config,
            type: config.type || 'success',
            buttonText: config.buttonText || 'OK'
        });
        this.alertIsVisible.set(true);

        return new Promise<void>((resolve) => {
            this.resolveAlertRef = resolve;
        });
    }

    closeAlert() {
        this.alertIsVisible.set(false);
        if (this.resolveAlertRef) {
            this.resolveAlertRef();
            this.resolveAlertRef = undefined;
        }
    }
}

