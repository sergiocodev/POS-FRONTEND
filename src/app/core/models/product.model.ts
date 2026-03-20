export interface BrandResponse {
    id: number;
    name: string;
}

export interface CategoryResponse {
    id: number;
    name: string;
}

export interface LaboratoryResponse {
    id: number;
    name: string;
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
}

export interface TaxTypeRequest {
    name: string;
    rate: number;
    codeSunat?: string;
}

export interface ActiveIngredientResponse {
    id: number;
    name: string;
    description?: string;
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
    tradeName: string;
    genericName?: string;
    description?: string;
    brandId: number;
    categoryId: number;
    laboratoryId: number;
    presentationId: number;
    taxTypeId: number;
    pharmaceuticalFormId: number;
    requiresPrescription: boolean;
    isGeneric: boolean;
    imageUrl?: string;
    ingredients?: ProductIngredientRequest[];
    therapeuticActionIds?: number[];
}

export interface ProductResponse {
    id: number;
    code: string;
    digemidCode?: string;
    tradeName: string;
    genericName?: string;
    description?: string;
    brandName?: string;
    categoryName?: string;
    laboratoryName?: string;
    presentationDescription?: string;
    pharmaceuticalFormName?: string;
    taxTypeName?: string;
    requiresPrescription: boolean;
    isGeneric: boolean;
    imageUrl?: string;
    ingredients?: ProductIngredientResponse[];
    therapeuticActionNames?: string[];
    therapeuticActionIds?: number[];
}

export interface ProductUnitRequest {
    productId: number;
    unitName: string;
    factor: number;
    barcode?: string;
    sunatCode?: string;
    price: number;
    isBaseUnit: boolean;
}

export interface ProductUnitResponse {
    id: number;
    productId: number;
    unitName: string;
    factor: number;
    barcode?: string;
    sunatCode?: string;
    price: number;
    isBaseUnit: boolean;
}
