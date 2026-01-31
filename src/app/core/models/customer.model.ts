export enum DocumentType {
    DNI = 'DNI',
    RUC = 'RUC',
    CE = 'CE',
    PASAPORTE = 'PASAPORTE'
}

export interface CustomerRequest {
    documentType: DocumentType;
    documentNumber: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
}

export interface CustomerResponse {
    id: number;
    documentType: DocumentType;
    documentNumber: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    createdAt: Date;
}
