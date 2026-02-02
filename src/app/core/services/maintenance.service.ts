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

@Injectable({
    providedIn: 'root'
})
export class MaintenanceService {
    private http = inject(HttpClient);

    getBrands(): Observable<BrandResponse[]> {
        return this.http.get<BrandResponse[]>('/api/v1/brands');
    }

    createBrand(name: string, active: boolean = true): Observable<BrandResponse> {
        return this.http.post<BrandResponse>('/api/v1/brands', { name, active });
    }

    updateBrand(id: number, name: string, active: boolean): Observable<BrandResponse> {
        return this.http.put<BrandResponse>(`/api/v1/brands/${id}`, { name, active });
    }

    deleteBrand(id: number): Observable<void> {
        return this.http.delete<void>(`/api/v1/brands/${id}`);
    }

    getCategories(): Observable<CategoryResponse[]> {
        return this.http.get<CategoryResponse[]>('/api/v1/categories');
    }

    createCategory(name: string, active: boolean = true): Observable<CategoryResponse> {
        return this.http.post<CategoryResponse>('/api/v1/categories', { name, active });
    }

    updateCategory(id: number, name: string, active: boolean): Observable<CategoryResponse> {
        return this.http.put<CategoryResponse>(`/api/v1/categories/${id}`, { name, active });
    }

    deleteCategory(id: number): Observable<void> {
        return this.http.delete<void>(`/api/v1/categories/${id}`);
    }

    getLaboratories(): Observable<LaboratoryResponse[]> {
        return this.http.get<LaboratoryResponse[]>('/api/v1/laboratories');
    }

    createLaboratory(name: string, active: boolean = true): Observable<LaboratoryResponse> {
        return this.http.post<LaboratoryResponse>('/api/v1/laboratories', { name, active });
    }

    updateLaboratory(id: number, name: string, active: boolean): Observable<LaboratoryResponse> {
        return this.http.put<LaboratoryResponse>(`/api/v1/laboratories/${id}`, { name, active });
    }

    deleteLaboratory(id: number): Observable<void> {
        return this.http.delete<void>(`/api/v1/laboratories/${id}`);
    }

    getPresentations(): Observable<PresentationResponse[]> {
        return this.http.get<PresentationResponse[]>('/api/v1/presentations');
    }

    createPresentation(description: string): Observable<PresentationResponse> {
        return this.http.post<PresentationResponse>('/api/v1/presentations', { description });
    }

    updatePresentation(id: number, description: string): Observable<PresentationResponse> {
        return this.http.put<PresentationResponse>(`/api/v1/presentations/${id}`, { description });
    }

    deletePresentation(id: number): Observable<void> {
        return this.http.delete<void>(`/api/v1/presentations/${id}`);
    }

    getTaxTypes(): Observable<TaxTypeResponse[]> {
        return this.http.get<TaxTypeResponse[]>('/api/v1/tax-types');
    }

    createTaxType(name: string, rate: number, codeSunat?: string, active: boolean = true): Observable<TaxTypeResponse> {
        return this.http.post<TaxTypeResponse>('/api/v1/tax-types', { name, rate, codeSunat, active });
    }

    updateTaxType(id: number, name: string, rate: number, codeSunat?: string, active?: boolean): Observable<TaxTypeResponse> {
        return this.http.put<TaxTypeResponse>(`/api/v1/tax-types/${id}`, { name, rate, codeSunat, active });
    }

    deleteTaxType(id: number): Observable<void> {
        return this.http.delete<void>(`/api/v1/tax-types/${id}`);
    }

    getActiveIngredients(): Observable<ActiveIngredientResponse[]> {
        return this.http.get<ActiveIngredientResponse[]>('/api/v1/active-ingredients');
    }

    createActiveIngredient(name: string, description?: string, active: boolean = true): Observable<ActiveIngredientResponse> {
        return this.http.post<ActiveIngredientResponse>('/api/v1/active-ingredients', { name, description, active });
    }

    updateActiveIngredient(id: number, name: string, description?: string, active?: boolean): Observable<ActiveIngredientResponse> {
        return this.http.put<ActiveIngredientResponse>(`/api/v1/active-ingredients/${id}`, { name, description, active });
    }

    deleteActiveIngredient(id: number): Observable<void> {
        return this.http.delete<void>(`/api/v1/active-ingredients/${id}`);
    }
}
