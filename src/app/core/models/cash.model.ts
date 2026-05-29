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
    cashSessionId: number;
    userId: number;
    username: string;
    conceptId: number;
    conceptName: string;
    amount: number;
    type: CashMovementType;
    reference?: string;
    description?: string;
    createdAt: string;
}

export interface CashInflowRequest {
    userId: number;
    amount: number;
    conceptId: number;
    description?: string;
    reference?: string;
}

export interface CashOutflowRequest {
    userId: number;
    amount: number;
    conceptId: number;
    description?: string;
    reference?: string;
}

export interface CloseSessionRequest {
    userId: number;
    closingBalance: number;
    notes?: string;
}

export interface SessionStatusResponse {
    sessionId: number;
    cashRegisterName: string;
    openedAt: string;
    status: string;

    openingBalance: number;
    calculatedBalance: number;

    totalCashSales: number;
    totalArCashPayments: number;
    totalCashInflows: number;

    totalApCashPayments: number;
    totalCashOutflows: number;

    totalSalesYape: number;
    totalSalesPlin: number;
    totalSalesTarjeta: number;
    totalSalesTransferencia: number;
    totalDigital: number;
}

export interface CashSessionSummaryResponse {
    label: string;
    value: string;
    prefix?: string;
    suffix?: string;
    trendValue?: string;
    trendDirection?: string;
    trendText?: string;
}
