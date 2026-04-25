export enum PayableStatus {
    PENDING = 'PENDING',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
    CANCELED = 'CANCELED'
}

export enum PayablePaymentMethod {
    EFECTIVO = 'EFECTIVO',
    TRANSFERENCIA = 'TRANSFERENCIA',
    TARJETA = 'TARJETA',
    YAPE = 'YAPE',
    PLIN = 'PLIN'
}

export interface AccountPayableResponse {
    id: number;
    purchaseId: number;
    supplierName: string;
    totalAmount: number;
    amountPaid: number;
    pendingBalance: number;
    status: PayableStatus;
    dueDate: string | null;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface AccountPayablePaymentRequest {
    accountPayableId: number;
    cashSessionId: number;
    amount: number;
    paymentMethod: PayablePaymentMethod;
    reference?: string;
    notes?: string;
}

export interface AccountPayablePaymentResponse {
    id: number;
    accountPayableId: number;
    supplierName: string;
    totalAmount: number;
    amountPaid: number;
    pendingBalance: number;
    cashSessionId: number;
    userId: number;
    username: string;
    amount: number;
    paymentMethod: PayablePaymentMethod;
    reference: string;
    notes: string;
    paymentDate: string;
}
