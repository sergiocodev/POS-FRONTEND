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

export enum ConceptType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE'
}

export interface CashConceptRequest {
    name: string;
    type: ConceptType;
    active?: boolean;
}

export interface CashConceptResponse {
    id: number;
    name: string;
    type: ConceptType;
    active: boolean;
}


export enum CashMovementType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE'
}

export interface CashMovementRequest {
    cashSessionId: number;
    cashConceptId: number;
    amount: number;
    referenceTable?: string;
    referenceId?: number;
    description?: string;
}

export interface CashMovementResponse {
    id: number;
    cashSessionName: string;
    cashConceptName: string;
    amount: number;
    type: CashMovementType;
    referenceTable?: string;
    referenceId?: number;
    description?: string;
    createdAt: string;
}
