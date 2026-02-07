export interface TherapeuticActionResponse {
    id: number;
    name: string;
    description?: string;
    active: boolean;
}

export interface TherapeuticActionRequest {
    name: string;
    description?: string;
    active: boolean;
}
