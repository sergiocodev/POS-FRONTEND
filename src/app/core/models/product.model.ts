export interface BrandResponse {
    id: number;
    name: string;
    active: boolean;
}

export interface CategoryResponse {
    id: number;
    name: string;
    active: boolean;
}

export interface LaboratoryResponse {
    id: number;
    name: string;
    active: boolean;
}

export interface PresentationResponse {
    id: number;
    description: string;
}

export interface TaxTypeResponse {
    id: number;
    name: string;
    rate: number;
    codeSunat: string;
    active: boolean;
}

export interface ActiveIngredientResponse {
    id: number;
    name: string;
    description?: string;
    active: boolean;
}

export interface ProductIngredientRequest {
    activeIngredientId: number;
    concentration?: string;
}

export interface ProductIngredientResponse {
    activeIngredientId: number;
    activeIngredientName: string;
    concentration?: string;
}

export interface ProductRequest {
    code: string;
    digemidCode?: string;
    name: string;
    description?: string;
    brandId: number;
    categoryId: number;
    laboratoryId: number;
    presentationId: number;
    taxTypeId: number;
    requiresPrescription: boolean;
    isGeneric: boolean;
    unitType: string;
    purchaseFactor: number;
    fractionLabel?: string;
    active: boolean;
    ingredients?: ProductIngredientRequest[];
}

export interface ProductResponse {
    id: number;
    code: string;
    digemidCode?: string;
    name: string;
    description?: string;
    brandName?: string;
    categoryName?: string;
    laboratoryName?: string;
    presentationDescription?: string;
    taxTypeName?: string;
    requiresPrescription: boolean;
    isGeneric: boolean;
    unitType: string;
    purchaseFactor: number;
    fractionLabel?: string;
    active: boolean;
    ingredients?: ProductIngredientResponse[];
}
