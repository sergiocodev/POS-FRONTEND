export enum SessionStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED'
}


export interface CashRegisterRequest {
    name: string;
    establishmentId: number;
    active?: boolean;
}

export interface CashRegisterResponse {
    id: number;
    name: string;
    establishmentId: number;
    establishmentName: string;
    active: boolean;
}


export interface CashSessionRequest {
    cashRegisterId: number;
    openingBalance: number;
    notes?: string;
}

export interface CashSessionResponse {
    id: number;
    cashRegisterName: string;
    username: string;
    openingBalance: number;
    closingBalance: number;
    calculatedBalance: number;
    diffAmount: number;
    openedAt: string;
    closedAt?: string;
    notes: string;
    status: SessionStatus;
    establishmentId: number;
}
