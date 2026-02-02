export enum VoidedSunatStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED'
}

export interface VoidedDocumentRequest {
    establishmentId: number;
    issueDate: string;
    saleIds: number[];
}

export interface VoidedDocumentResponse {
    id: number;
    establishmentName: string;
    username: string;
    ticketSunat?: string;
    xmlUrl?: string;
    cdrUrl?: string;
    issueDate: string;
    sunatStatus: VoidedSunatStatus;
    sunatDescription?: string;
    createdAt: string;
    items: VoidedDocumentItemResponse[];
}

export interface VoidedDocumentItemResponse {
    id: number;
    saleId: number;
    description: string;
}
