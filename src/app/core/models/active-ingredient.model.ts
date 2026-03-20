export interface ActiveIngredientRequest {
    name: string;
    description?: string;
}

export interface ActiveIngredientResponse {
    id: number;
    name: string;
    description?: string;
}
