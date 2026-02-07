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
    accumulatedPoints: number;
    createdAt: Date;
}

export interface ExternalLookupResponse {
    nombres?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    tipoDocumento?: string;
    numeroDocumento?: string;
    razonSocial?: string;
    estado?: string;
    condicion?: string;
    direccion?: string;
    distrito?: string;
    provincia?: string;
    departamento?: string;
}
