export interface SupplierRequest {
    name: string;
    ruc?: string;
    phone?: string;
    email?: string;
    address?: string;
    category?: string;
    contactName?: string;
    status?: string;
    rating?: number;
}

export interface SupplierResponse {
    id: number;
    name: string;
    ruc?: string;
    phone?: string;
    email?: string;
    address?: string;
    category?: string;
    contactName?: string;
    status?: string;
    rating?: number;
}

export interface SupplierSummaryResponse {
    activeSuppliers: number;
    evaluatingSuppliers: number;
    expiredSuppliers: number;
    totalSpendYear: number;
    averageRating: number;
}

export interface SupplierDetailResponse {
    id: number;
    name: string;
    ruc?: string;
    category?: string;
    contactName?: string;
    email?: string;
    status?: string;
    rating?: number;
    lastPurchase?: string;
    purchaseVolume?: number;
}
