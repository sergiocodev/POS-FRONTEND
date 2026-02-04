export interface EmployeeRequest {
    firstName: string;
    lastName?: string;
    documentNumber?: string;
    userId?: number;
    active: boolean;
}

export interface EmployeeResponse {
    id: number;
    firstName: string;
    lastName?: string;
    documentNumber?: string;
    username?: string;
    email?: string;
    active: boolean;
}
