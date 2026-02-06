import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    BrandResponse,
    CategoryResponse,
    LaboratoryResponse,
    PresentationResponse,
    TaxTypeResponse,
    ActiveIngredientResponse
} from '../models/product.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class MaintenanceService {
    private http = inject(HttpClient);

    getBrands(): Observable<ResponseApi<BrandResponse[]>> {
        return this.http.get<ResponseApi<BrandResponse[]>>('/api/v1/brands');
    }

    createBrand(name: string, active: boolean = true): Observable<ResponseApi<BrandResponse>> {
        return this.http.post<ResponseApi<BrandResponse>>('/api/v1/brands', { name, active });
    }

    updateBrand(id: number, name: string, active: boolean): Observable<ResponseApi<BrandResponse>> {
        return this.http.put<ResponseApi<BrandResponse>>(`/api/v1/brands/${id}`, { name, active });
    }

    deleteBrand(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/brands/${id}`);
    }

    getCategories(): Observable<ResponseApi<CategoryResponse[]>> {
        return this.http.get<ResponseApi<CategoryResponse[]>>('/api/v1/categories');
    }

    createCategory(name: string, active: boolean = true): Observable<ResponseApi<CategoryResponse>> {
        return this.http.post<ResponseApi<CategoryResponse>>('/api/v1/categories', { name, active });
    }

    updateCategory(id: number, name: string, active: boolean): Observable<ResponseApi<CategoryResponse>> {
        return this.http.put<ResponseApi<CategoryResponse>>(`/api/v1/categories/${id}`, { name, active });
    }

    deleteCategory(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/categories/${id}`);
    }

    getLaboratories(): Observable<ResponseApi<LaboratoryResponse[]>> {
        return this.http.get<ResponseApi<LaboratoryResponse[]>>('/api/v1/laboratories');
    }

    createLaboratory(name: string, active: boolean = true): Observable<ResponseApi<LaboratoryResponse>> {
        return this.http.post<ResponseApi<LaboratoryResponse>>('/api/v1/laboratories', { name, active });
    }

    updateLaboratory(id: number, name: string, active: boolean): Observable<ResponseApi<LaboratoryResponse>> {
        return this.http.put<ResponseApi<LaboratoryResponse>>(`/api/v1/laboratories/${id}`, { name, active });
    }

    deleteLaboratory(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/laboratories/${id}`);
    }

    getPresentations(): Observable<ResponseApi<PresentationResponse[]>> {
        return this.http.get<ResponseApi<PresentationResponse[]>>('/api/v1/presentations');
    }

    createPresentation(description: string): Observable<ResponseApi<PresentationResponse>> {
        return this.http.post<ResponseApi<PresentationResponse>>('/api/v1/presentations', { description });
    }

    updatePresentation(id: number, description: string): Observable<ResponseApi<PresentationResponse>> {
        return this.http.put<ResponseApi<PresentationResponse>>(`/api/v1/presentations/${id}`, { description });
    }

    deletePresentation(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/presentations/${id}`);
    }

    getTaxTypes(): Observable<ResponseApi<TaxTypeResponse[]>> {
        return this.http.get<ResponseApi<TaxTypeResponse[]>>('/api/v1/tax-types');
    }

    createTaxType(name: string, rate: number, codeSunat?: string, active: boolean = true): Observable<ResponseApi<TaxTypeResponse>> {
        return this.http.post<ResponseApi<TaxTypeResponse>>('/api/v1/tax-types', { name, rate, codeSunat, active });
    }

    updateTaxType(id: number, name: string, rate: number, codeSunat?: string, active?: boolean): Observable<ResponseApi<TaxTypeResponse>> {
        return this.http.put<ResponseApi<TaxTypeResponse>>(`/api/v1/tax-types/${id}`, { name, rate, codeSunat, active });
    }

    deleteTaxType(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/tax-types/${id}`);
    }

    getActiveIngredients(): Observable<ResponseApi<ActiveIngredientResponse[]>> {
        return this.http.get<ResponseApi<ActiveIngredientResponse[]>>('/api/v1/active-ingredients');
    }

    createActiveIngredient(name: string, description?: string, active: boolean = true): Observable<ResponseApi<ActiveIngredientResponse>> {
        return this.http.post<ResponseApi<ActiveIngredientResponse>>('/api/v1/active-ingredients', { name, description, active });
    }

    updateActiveIngredient(id: number, name: string, description?: string, active?: boolean): Observable<ResponseApi<ActiveIngredientResponse>> {
        return this.http.put<ResponseApi<ActiveIngredientResponse>>(`/api/v1/active-ingredients/${id}`, { name, description, active });
    }

    deleteActiveIngredient(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/active-ingredients/${id}`);
    }
}
