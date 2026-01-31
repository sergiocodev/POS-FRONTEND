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
        return this.http.get<BrandResponse[]>('/api/brands');
    }

    getCategories(): Observable<CategoryResponse[]> {
        return this.http.get<CategoryResponse[]>('/api/categories');
    }

    getLaboratories(): Observable<LaboratoryResponse[]> {
        return this.http.get<LaboratoryResponse[]>('/api/laboratories');
    }

    getPresentations(): Observable<PresentationResponse[]> {
        return this.http.get<PresentationResponse[]>('/api/presentations');
    }

    getTaxTypes(): Observable<TaxTypeResponse[]> {
        return this.http.get<TaxTypeResponse[]>('/api/tax-types');
    }

    getActiveIngredients(): Observable<ActiveIngredientResponse[]> {
        return this.http.get<ActiveIngredientResponse[]>('/api/active-ingredients');
    }
}
