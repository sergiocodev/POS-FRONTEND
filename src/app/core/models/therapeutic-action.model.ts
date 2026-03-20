export interface TherapeuticActionResponse {
    id: number;
    name: string;
    description: string;
}

export interface TherapeuticActionRequest {
    name: string;
    description?: string;
}
