export enum MovementType {
    SALE = 'SALE',
    PURCHASE = 'PURCHASE',
    ADJUSTMENT_IN = 'ADJUSTMENT_IN',
    ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
    TRANSFER_IN = 'TRANSFER_IN',
    TRANSFER_OUT = 'TRANSFER_OUT',
    SALE_RETURN = 'SALE_RETURN',
    VOID_RETURN = 'VOID_RETURN'
}

export enum ReferenceType {
    COMPRA = 'COMPRA',
    VENTA = 'VENTA',
    AJUSTE = 'AJUSTE',
    TRASLADO = 'TRASLADO'
}


export interface ProductLotRequest {
    productId: number;
    lotCode: string;
    expiryDate: string;
}

export interface ProductLotResponse {
    id: number;
    productId: number;
    productName: string;
    lotCode: string;
    expiryDate: string;
    createdAt: string;
}


export interface InventoryRequest {
    establishmentId: number;
    lotId: number;
    quantity: number;
    costPrice?: number;
    salesPrice?: number;
    movementType?: string;
    notes?: string;
}

export interface InventoryResponse {
    id: number;
    establishmentId: number;
    establishmentName: string;
    lotId: number;
    lotCode: string;
    productName: string;
    quantity: number;
    minStock?: number;
    maxStock?: number;
    locationShelf?: string;
    costPrice: number;
    salesPrice: number;
    lastMovement: string;
}


export interface StockMovementRequest {
    establishmentId: number;
    productId: number;
    lotId?: number;
    type: MovementType;
    quantity: number;
    reason?: string;
    referenceId?: number;
    referenceType?: ReferenceType;
}

export interface StockMovementResponse {
    id: number;
    establishmentName: string;
    productName: string;
    lotCode?: string;
    type: MovementType;
    quantity: number;
    reason: string;
    balanceAfter: number;
    referenceTable?: string;
    referenceId?: number;
    userName?: string;
    createdAt: string;
}
