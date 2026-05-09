export enum ReceivableStatus {
    PENDING = 'PENDING',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
    CANCELED = 'CANCELED'
}

export enum ReceivablePaymentMethod {
    EFECTIVO = 'EFECTIVO',
    TRANSFERENCIA = 'TRANSFERENCIA',
    YAPE = 'YAPE',
    PLIN = 'PLIN',
    TARJETA = 'TARJETA'
}

export interface AccountReceivableResponse {
    id: number;
    saleIdentifier: string;
    customerName: string;
    totalAmount: number;
    amountPaid: number;
    pendingBalance: number;
    status: ReceivableStatus;
    daysUntilDue: number | null;
    dueDate: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface AccountReceivablePaymentRequest {
    accountReceivableId: number;
    cashSessionId: number;
    amount: number;
    paymentMethod: ReceivablePaymentMethod;
    reference?: string;
    notes?: string;
}

export interface AccountReceivablePaymentResponse {
    id: number;
    accountReceivableId: number;
    customerName: string;
    totalAmount: number;
    amountPaid: number;
    pendingBalance: number;
    cashSessionId: number;
    userId: number;
    username: string;
    amount: number;
    paymentMethod: ReceivablePaymentMethod;
    reference: string;
    notes: string;
    paymentDate: string;
}
