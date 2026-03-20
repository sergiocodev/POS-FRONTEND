export enum SessionStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED'
}


export interface CashRegisterRequest {
    name: string;
    establishmentId: number;
}

export interface CashRegisterResponse {
    id: number;
    name: string;
    establishmentId: number;
    establishmentName: string;
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

export enum ConceptType {
    IN = 'IN',
    OUT = 'OUT'
}

export interface CashConceptRequest {
    name: string;
    type: ConceptType;
}

export interface CashConceptResponse {
    id: number;
    name: string;
    type: ConceptType;
}


export enum CashMovementType {
    IN = 'IN',
    OUT = 'OUT'
}

export interface CashMovementRequest {
    cashSessionId: number;
    cashConceptId: number;
    amount: number;
    reference?: string;
    description?: string;
}

export interface CashMovementResponse {
    id: number;
    cashSessionName: string;
    cashConceptName: string;
    amount: number;
    type: CashMovementType;
    reference?: string;
    description?: string;
    createdAt: string;
}
