export enum SaleDocumentType {
    TICKET = 'TICKET',
    BOLETA = 'BOLETA',
    FACTURA = 'FACTURA',
    NOTA_CREDITO = 'NOTA_CREDITO',
    NOTA_DEBITO = 'NOTA_DEBITO',
    NOTA_DE_VENTA = 'NOTA_DE_VENTA'
}

export enum SaleStatus {
    COMPLETED = 'COMPLETED',
    CANCELED = 'CANCELED',
    VOIDED = 'VOIDED'
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
    TRANSFERENCIA = 'TRANSFERENCIA',
    YAPE = 'YAPE',
    PLIN = 'PLIN',
    TARJETA = 'TARJETA'
}

export enum PaymentCondition {
    CASH = 'CONTADO',
    CREDIT = 'CREDITO'
}

export interface SaleItemRequest {
    productId: number;
    productUnitId: number;
    lotId?: number;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    discountReason?: string;
    increaseAmount?: number;
    increaseReason?: string;
}

export interface SaleItemResponse {
    id: number;
    productName: string;
    productUnitId: number;
    lotCode?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    appliedTaxRate: number;
    discountAmount: number;
    discountReason?: string;
    increaseAmount?: number;
    increaseReason?: string;
}

export interface SalePaymentRequest {
    paymentMethod: PaymentMethod;
    amount: number;
    cashSessionId: number;
    reference?: string;
}

export interface SalePaymentResponse {
    id: number;
    paymentMethod: PaymentMethod;
    amount: number;
    reference?: string;
    createdAt: string;
}

export interface ProductForSaleResponse {
    id: number;
    productId: number;
    productUnitId: number;
    tradeName: string;
    genericName?: string;
    description: string;
    presentation: string;
    concentration: string;
    category: string;
    laboratory: string;
    salesPrice: number;
    stock: number;
    expirationDate: string;
    lotCode: string;
    lotId: number;
    barcode?: string;
    imageUrl?: string;
    unitName: string;
    factor: number;
    taxRate: number;
}

export interface SaleRequest {
    establishmentId: number;
    cashSessionId?: number;
    customerId?: number;
    documentType: SaleDocumentType;
    series?: string;
    relatedSaleId?: number;
    noteCode?: string;
    noteReason?: string;
    items: SaleItemRequest[];
    payments: SalePaymentRequest[];
    paymentCondition?: PaymentCondition | string;
    dueDate?: string;
}

import { CompanyMinimalResponse } from './company.model';

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
    cdrUrl?: string;
    sunatResponseJson?: string;
    sunatErrorCode?: string;
    relatedSaleId?: number;
    noteCode?: string;
    noteReason?: string;
    voided: boolean;
    voidedAt?: string;
    voidReason?: string;
    items: SaleItemResponse[];
    payments: SalePaymentResponse[];
    paymentCondition?: string;
    company?: CompanyMinimalResponse;
    customerDocumentType: string;
    customerDocumentNumber: string;
    customerAddress: string;
    userFullName: string;
}

export interface EstablishmentResponse {
    id: number;
    name: string;
    address: string;
    codeSunat: string;
}

export interface SaleSummaryResponse {
    totalFacturas: number;
    totalBoletas: number;
    totalNotaCredito: number;
    totalNotaDebito: number;
    totalNotaVenta: number;
    totalNeto: number;
}

export interface CartItem {
    product: ProductForSaleResponse;
    quantity: number;
    price: number;
    adjustment: number;
    adjustmentInput: number;
    adjustmentType: 'amount' | 'percentage';
    total: number;
    stock: number;
}

export interface SaleFormData {
    documentType: SaleDocumentType;
    series: string;
    paymentCondition: PaymentCondition | string;
    dueDate?: string;
    items: CartItem[];
    customer: CompanyMinimalResponse | any; // Any until we strongly type customer or import CustomerResponse
    total: number;
    payments: Array<{
        paymentMethod: PaymentMethod;
        amount: number;
        reference?: string;
    }>;
}
