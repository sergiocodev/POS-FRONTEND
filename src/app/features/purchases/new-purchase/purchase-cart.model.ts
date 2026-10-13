import { ProductResponse, ProductUnitResponse } from '../../../core/models/product.model';

export interface PurchaseCartItem {
    product: ProductResponse;
    unit: ProductUnitResponse;
    quantity: number;
    unitCost: number;
    totalCost: number;
    lotCode: string;
    expiryDate: string;
}
