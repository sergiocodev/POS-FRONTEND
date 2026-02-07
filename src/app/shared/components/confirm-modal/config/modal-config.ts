export interface ModalConfig {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    btnColor?: 'primary' | 'danger' | 'warning' | 'success'; // Colores de Bootstrap
}