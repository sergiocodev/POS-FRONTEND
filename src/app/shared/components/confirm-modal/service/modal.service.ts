// modal.service.ts
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    // Datos internos para controlar el modal de confirmación
    isVisible = false;
    config: any = {};

    // Datos internos para controlar el modal de alerta
    alertIsVisible = false;
    alertConfig: any = {};

    // Promesas para devolver la respuesta
    private resolveRef: any;
    private resolveAlertRef: any;

    // --- CONFIRMATION MODAL ---

    confirm(config: {
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        btnColor?: string
    }): Promise<boolean> {

        this.config = config;
        this.isVisible = true; // Abre el modal

        // Retorna una promesa que se resuelve cuando el usuario hace clic
        return new Promise<boolean>((resolve) => {
            this.resolveRef = resolve;
        });
    }

    close(result: boolean) {
        this.isVisible = false;
        if (this.resolveRef) {
            this.resolveRef(result); // Resuelve la promesa con true o false
        }
    }

    // --- ALERT MODAL ---

    alert(config: {
        title: string;
        message: string;
        type?: 'success' | 'error' | 'warning';
        buttonText?: string;
    }): Promise<void> {
        this.alertConfig = config;
        this.alertConfig.type = config.type || 'success';
        this.alertConfig.buttonText = config.buttonText || 'OK';
        this.alertIsVisible = true;

        return new Promise<void>((resolve) => {
            this.resolveAlertRef = resolve;
        });
    }

    closeAlert() {
        this.alertIsVisible = false;
        if (this.resolveAlertRef) {
            this.resolveAlertRef();
        }
    }
}
