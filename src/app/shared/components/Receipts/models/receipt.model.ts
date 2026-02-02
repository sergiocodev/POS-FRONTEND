export interface ReceiptHeader {
    companyLegalName?: string;
    companyRUC?: string;
    companyAddress?: string;
    companyEmail?: string;
    companyWebsite?: string;
    documentType?: string;
    seriesAndNumber?: string;
    issueDate: string | Date;
}

export interface ReceiptItem {
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
}

export interface ReceiptBody {
    clientName?: string;
    clientDocumentNumber?: string;
    paymentMethod?: string;
    noteTypeDescription?: string;
    reason?: string;
    modifiedDocument?: string;
    displayItems: ReceiptItem[];
    opGravadas: number;
    opInafectas: number;
    opExoneradas: number;
    igv: number;
    icbper: number;
    total: number;
    totalInWords?: string;
    footerNote?: string;
    cpeUrl?: string;
    qrBase64?: string;
    invalidationReason?: string;
}

export interface SaleOrNoteReceiptDto {
    header: ReceiptHeader;
    body: ReceiptBody;
}
