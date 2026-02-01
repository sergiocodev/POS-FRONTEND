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

    getCategories(): Observable<CategoryResponse[]> {
        return this.http.get<CategoryResponse[]>('/api/v1/categories');
    }

    getLaboratories(): Observable<LaboratoryResponse[]> {
        return this.http.get<LaboratoryResponse[]>('/api/v1/laboratories');
    }

    getPresentations(): Observable<PresentationResponse[]> {
        return this.http.get<PresentationResponse[]>('/api/v1/presentations');
    }

    getTaxTypes(): Observable<TaxTypeResponse[]> {
        return this.http.get<TaxTypeResponse[]>('/api/v1/tax-types');
    }

    getActiveIngredients(): Observable<ActiveIngredientResponse[]> {
        return this.http.get<ActiveIngredientResponse[]>('/api/v1/active-ingredients');
    }
}
