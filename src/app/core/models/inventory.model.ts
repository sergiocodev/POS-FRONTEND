export enum MovementType {
    ENTRADA = 'ENTRADA',
    SALIDA = 'SALIDA',
    AJUSTE = 'AJUSTE'
}

export enum ReferenceType {
    COMPRA = 'COMPRA',
    VENTA = 'VENTA',
    AJUSTE = 'AJUSTE',
    TRASLADO = 'TRASLADO'
}

/**
 * Product Lot Models
 */
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

/**
 * Inventory Models
 */
export interface InventoryRequest {
    establishmentId: number;
    lotId: number;
    quantity: number;
    costPrice?: number;
    salesPrice?: number;
    movementType?: string; // IN, OUT, ADJUSTMENT, LOSS, THEFT, RETURN
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
    costPrice: number;
    salesPrice: number;
    lastMovement: string;
}

/**
 * Stock Movement Models
 */
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
    referenceId?: number;
    referenceType?: ReferenceType;
    createdAt: string;
}
