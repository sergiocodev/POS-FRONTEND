export interface ActiveIngredientRequest {
    name: string;
    description?: string;
    active: boolean;
}

export interface ActiveIngredientResponse {
    id: number;
    name: string;
    description?: string;
    active: boolean;
}
