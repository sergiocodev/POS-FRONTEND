export enum PurchaseDocumentType {
    GUIA = 'GUIA',
    FACTURA = 'FACTURA',
    BOLETA = 'BOLETA'
}

export enum PurchaseStatus {
    PENDING = 'PENDING',
    RECEIVED = 'RECEIVED',
    CANCELED = 'CANCELED'
}

export enum PaymentCondition {
    CASH = 'CONTADO',
    CREDIT = 'CREDITO'
}

export enum PaymentMethod {
    EFECTIVO = 'EFECTIVO',
    TRANSFERENCIA = 'TRANSFERENCIA',
    YAPE = 'YAPE',
    PLIN = 'PLIN',
    TARJETA = 'TARJETA'
}

export interface PurchaseItemRequest {
    productId: number;
    productUnitId: number;
    lotCode: string;
    expiryDate: string;
    quantity: number;
    bonusQuantity?: number;
    unitCost: number;
}

export interface PurchaseItemResponse {
    id: number;
    productName: string;
    productUnitId: number;
    lotCode: string;
    expiryDate: string;
    quantity: number;
    bonusQuantity: number;
    unitCost: number;
    totalCost: number;
}

export interface PurchaseRequest {
    supplierId: number;
    establishmentId: number;
    documentType: PurchaseDocumentType;
    series?: string;
    number?: string;
    issueDate: string;
    notes?: string;
    items: PurchaseItemRequest[];
    paymentCondition: PaymentCondition;
    initialPayment?: number;
    paymentMethod?: PaymentMethod;
    dueDate?: string;
}

export interface PurchaseResponse {
    id: number;
    supplierName: string;
    establishmentName: string;
    username: string;
    documentType: PurchaseDocumentType;
    series: string;
    number: string;
    issueDate: string;
    arrivalDate: string;
    subTotal: number;
    tax: number;
    total: number;
    status: PurchaseStatus;
    paymentCondition?: string;
    notes: string;
    items: PurchaseItemResponse[];
}
