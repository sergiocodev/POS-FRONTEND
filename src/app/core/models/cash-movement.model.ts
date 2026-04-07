export interface CashMovement {
    id: number;
    cashSessionId: number;
    userId: number;
    username: string;
    conceptId: number;
    conceptName: string;
    amount: number;
    type: 'IN' | 'OUT';
    reference?: string;
    description?: string;
    createdAt: string;
}

export interface CashMovementRequest {
    amount: number;
    conceptId: number;
    reference?: string;
    description?: string;
    userId: number;
}
