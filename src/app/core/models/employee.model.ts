export interface EmployeeRequest {
    firstName: string;
    lastName?: string;
    documentNumber?: string;
    userId?: number;
}

export interface EmployeeResponse {
    id: number;
    firstName: string;
    lastName?: string;
    documentNumber?: string;
    username?: string;
    email?: string;
}
