export interface PharmaceuticalFormResponse {
    id: number;
    name: string;
    description?: string;
    active: boolean;
}

export interface PharmaceuticalFormRequest {
    name: string;
    description?: string;
    active: boolean;
}
