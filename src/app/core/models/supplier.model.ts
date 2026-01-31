export interface SupplierRequest {
    name: string;
    ruc?: string;
    phone?: string;
    email?: string;
    address?: string;
    active: boolean;
}

export interface SupplierResponse {
    id: number;
    name: string;
    ruc?: string;
    phone?: string;
    email?: string;
    address?: string;
    active: boolean;
}
