export enum PayableStatus {
    PENDING = 'PENDING',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID'
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
    createdAt: string;
}

export interface AccountPayablePaymentRequest {
    amount: number;
}
