export enum SaleDocumentType {
    TICKET = 'TICKET',
    BOLETA = 'BOLETA',
    FACTURA = 'FACTURA',
    NOTA_CREDITO = 'NOTA_CREDITO'
}

export enum SaleStatus {
    COMPLETED = 'COMPLETED',
    CANCELED = 'CANCELED'
}

export enum SunatStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    ACCEPTED = 'ACCEPTED',
    OBSERVED = 'OBSERVED',
    REJECTED = 'REJECTED',
    VOIDED = 'VOIDED'
}

export enum PaymentMethod {
    EFECTIVO = 'EFECTIVO',
    VISA = 'VISA',
    MASTERCARD = 'MASTERCARD',
    YAPE = 'YAPE',
    PLIN = 'PLIN',
    TRANSFERENCIA = 'TRANSFERENCIA'
}

export interface SaleItemRequest {
    productId: number;
    lotId?: number;
    quantity: number;
    unitPrice: number;
}

export interface SaleItemResponse {
    id: number;
    productName: string;
    lotCode?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface SalePaymentRequest {
    paymentMethod: PaymentMethod;
    amount: number;
    reference?: string;
}

export interface SalePaymentResponse {
    id: number;
    paymentMethod: PaymentMethod;
    amount: number;
    reference?: string;
    createdAt: string;
}

export interface SaleRequest {
    establishmentId: number;
    cashSessionId?: number;
    customerId?: number;
    documentType: SaleDocumentType;
    items: SaleItemRequest[];
    payments: SalePaymentRequest[];
}

export interface SaleResponse {
    id: number;
    establishmentName: string;
    customerName: string;
    username: string;
    documentType: SaleDocumentType;
    series: string;
    number: string;
    date: string;
    subTotal: number;
    tax: number;
    total: number;
    status: SaleStatus;
    sunatStatus: SunatStatus;
    pdfUrl?: string;
    items: SaleItemResponse[];
    payments: SalePaymentResponse[];
}

export interface EstablishmentResponse {
    id: number;
    name: string;
    address: string;
    codeSunat: string;
    active: boolean;
}
