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

export interface PurchaseItemRequest {
    productId: number;
    lotCode: string;
    expiryDate: string;
    quantity: number;
    bonusQuantity?: number;
    unitCost: number;
}

export interface PurchaseItemResponse {
    id: number;
    productName: string;
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
    notes: string;
    items: PurchaseItemResponse[];
}
