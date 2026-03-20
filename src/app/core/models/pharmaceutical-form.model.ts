export interface PharmaceuticalFormResponse {
    id: number;
    name: string;
    description: string;
}

export interface PharmaceuticalFormRequest {
    name: string;
    description?: string;
}
