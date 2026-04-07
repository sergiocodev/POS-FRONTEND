export enum TransferStatus {
    PENDING = 'PENDING',
    IN_TRANSIT = 'IN_TRANSIT',
    COMPLETED = 'COMPLETED',
    CANCELED = 'CANCELED'
}

export interface StockTransferItemRequest {
    productId: number;
    lotId: number;
    unitId: number;
    quantity: number;
}

export interface StockTransferRequest {
    sourceEstablishmentId: number;
    targetEstablishmentId: number;
    notes?: string;
    items: StockTransferItemRequest[];
}

export interface StockTransferItemResponse {
    id: number;
    stockTransferId: number;
    productId: number;
    productName: string;
    lotId: number;
    lotCode: string;
    unitId?: number;
    unitName?: string;
    unitFactor?: number;
    quantity: number;
}

export interface StockTransferResponse {
    id: number;
    transferNumber: string;
    sourceEstablishmentId: number;
    sourceEstablishmentName: string;
    targetEstablishmentId: number;
    targetEstablishmentName: string;
    status: TransferStatus;
    userId: number;
    userName: string;
    expectedDate?: string;
    carrierInfo?: string;
    trackingNumber?: string;
    totalCost?: number;
    createdAt: string;
    sentAt?: string;
    receivedAt?: string;
    notes?: string;
    items: StockTransferItemResponse[];
}
