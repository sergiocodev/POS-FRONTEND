import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import {
    BrandResponse,
    CategoryResponse,
    LaboratoryResponse,
    PresentationResponse,
    TaxTypeResponse,
    ActiveIngredientResponse
} from '../models/product.model';
import { PharmaceuticalFormResponse } from '../models/pharmaceutical-form.model';
import { TherapeuticActionResponse } from '../models/therapeutic-action.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class MaintenanceService {
    private http = inject(HttpClient);

    private brandsCache$?: Observable<ResponseApi<BrandResponse[]>>;
    private categoriesCache$?: Observable<ResponseApi<CategoryResponse[]>>;
    private laboratoriesCache$?: Observable<ResponseApi<LaboratoryResponse[]>>;
    private presentationsCache$?: Observable<ResponseApi<PresentationResponse[]>>;
    private taxTypesCache$?: Observable<ResponseApi<TaxTypeResponse[]>>;
    private activeIngredientsCache$?: Observable<ResponseApi<ActiveIngredientResponse[]>>;
    private pharmaceuticalFormsCache$?: Observable<ResponseApi<PharmaceuticalFormResponse[]>>;
    private therapeuticActionsCache$?: Observable<ResponseApi<TherapeuticActionResponse[]>>;

    getAllBrands(): Observable<ResponseApi<BrandResponse[]>> {
        if (!this.brandsCache$) {
            this.brandsCache$ = this.http.get<ResponseApi<BrandResponse[]>>('/api/v1/brands/GetAllBrands').pipe(shareReplay(1));
        }
        return this.brandsCache$;
    }

    createNewBrand(name: string): Observable<ResponseApi<BrandResponse>> {
        return this.http.post<ResponseApi<BrandResponse>>('/api/v1/brands/CreateNewBrand', { name });
    }

    updateBrandById(id: number, name: string): Observable<ResponseApi<BrandResponse>> {
        return this.http.put<ResponseApi<BrandResponse>>(`/api/v1/brands/UpdateBrandById/${id}`, { name });
    }

    deleteBrandById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/brands/DeleteBrandById/${id}`);
    }

    getAllCategory(): Observable<ResponseApi<CategoryResponse[]>> {
        if (!this.categoriesCache$) {
            this.categoriesCache$ = this.http.get<ResponseApi<CategoryResponse[]>>('/api/v1/category/GetAllCategory').pipe(shareReplay(1));
        }
        return this.categoriesCache$;
    }

    createNewCategory(name: string): Observable<ResponseApi<CategoryResponse>> {
        return this.http.post<ResponseApi<CategoryResponse>>('/api/v1/category/CreateNewCategory', { name });
    }

    updateCategoryById(id: number, name: string): Observable<ResponseApi<CategoryResponse>> {
        return this.http.put<ResponseApi<CategoryResponse>>(`/api/v1/category/UpdateCategoryById/${id}`, { name });
    }

    deleteCategoryById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/category/DeleteCategoryById/${id}`);
    }

    getAllLaboratory(): Observable<ResponseApi<LaboratoryResponse[]>> {
        if (!this.laboratoriesCache$) {
            this.laboratoriesCache$ = this.http.get<ResponseApi<LaboratoryResponse[]>>('/api/v1/laboratory/GetAllLaboratory').pipe(shareReplay(1));
        }
        return this.laboratoriesCache$;
    }

    createNewLaboratory(name: string): Observable<ResponseApi<LaboratoryResponse>> {
        return this.http.post<ResponseApi<LaboratoryResponse>>('/api/v1/laboratory/CreateNewLaboratory', { name });
    }

    updateLaboratoryById(id: number, name: string): Observable<ResponseApi<LaboratoryResponse>> {
        return this.http.put<ResponseApi<LaboratoryResponse>>(`/api/v1/laboratory/UpdateLaboratoryById/${id}`, { name });
    }

    deleteLaboratoryById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/laboratory/DeleteLaboratoryById/${id}`);
    }

    getAllPresentations(): Observable<ResponseApi<PresentationResponse[]>> {
        if (!this.presentationsCache$) {
            this.presentationsCache$ = this.http.get<ResponseApi<PresentationResponse[]>>('/api/v1/presentations/GetAllPresentations').pipe(shareReplay(1));
        }
        return this.presentationsCache$;
    }

    createNewPresentation(description: string): Observable<ResponseApi<PresentationResponse>> {
        return this.http.post<ResponseApi<PresentationResponse>>('/api/v1/presentations/CreateNewPresentation', { description });
    }

    updatePresentationById(id: number, description: string): Observable<ResponseApi<PresentationResponse>> {
        return this.http.put<ResponseApi<PresentationResponse>>(`/api/v1/presentations/UpdatePresentationById/${id}`, { description });
    }

    deletePresentationById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/presentations/DeletePresentationById/${id}`);
    }

    getAllTaxTypes(): Observable<ResponseApi<TaxTypeResponse[]>> {
        if (!this.taxTypesCache$) {
            this.taxTypesCache$ = this.http.get<ResponseApi<TaxTypeResponse[]>>('/api/v1/tax-types/GetAllTaxTypes').pipe(shareReplay(1));
        }
        return this.taxTypesCache$;
    }

    createNewTaxType(name: string, rate: number, codeSunat?: string): Observable<ResponseApi<TaxTypeResponse>> {
        return this.http.post<ResponseApi<TaxTypeResponse>>('/api/v1/tax-types/CreateNewTaxType', { name, rate, codeSunat });
    }

    updateTaxTypeById(id: number, name: string, rate: number, codeSunat?: string): Observable<ResponseApi<TaxTypeResponse>> {
        return this.http.put<ResponseApi<TaxTypeResponse>>(`/api/v1/tax-types/UpdateTaxTypeById/${id}`, { name, rate, codeSunat });
    }

    deleteTaxTypeById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/tax-types/DeleteTaxTypeById/${id}`);
    }

    getAllActiveIngredients(): Observable<ResponseApi<ActiveIngredientResponse[]>> {
        if (!this.activeIngredientsCache$) {
            this.activeIngredientsCache$ = this.http.get<ResponseApi<ActiveIngredientResponse[]>>('/api/v1/active-ingredients/GetAllActiveIngredients').pipe(shareReplay(1));
        }
        return this.activeIngredientsCache$;
    }

    createNewActiveIngredient(name: string, description?: string): Observable<ResponseApi<ActiveIngredientResponse>> {
        return this.http.post<ResponseApi<ActiveIngredientResponse>>('/api/v1/active-ingredients/CreateNewActiveIngredient', { name, description });
    }

    updateActiveIngredientById(id: number, name: string, description?: string): Observable<ResponseApi<ActiveIngredientResponse>> {
        return this.http.put<ResponseApi<ActiveIngredientResponse>>(`/api/v1/active-ingredients/UpdateActiveIngredientById/${id}`, { name, description });
    }

    deleteActiveIngredientById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/active-ingredients/DeleteActiveIngredientById/${id}`);
    }

    getAllPharmaceuticalForms(): Observable<ResponseApi<PharmaceuticalFormResponse[]>> {
        if (!this.pharmaceuticalFormsCache$) {
            this.pharmaceuticalFormsCache$ = this.http.get<ResponseApi<PharmaceuticalFormResponse[]>>('/api/v1/pharmaceutical-forms/GetAllPharmaceuticalForms').pipe(shareReplay(1));
        }
        return this.pharmaceuticalFormsCache$;
    }

    createNewPharmaceuticalForm(name: string, description?: string): Observable<ResponseApi<PharmaceuticalFormResponse>> {
        return this.http.post<ResponseApi<PharmaceuticalFormResponse>>('/api/v1/pharmaceutical-forms/CreateNewPharmaceuticalForm', { name, description });
    }

    updatePharmaceuticalFormById(id: number, name: string, description?: string): Observable<ResponseApi<PharmaceuticalFormResponse>> {
        return this.http.put<ResponseApi<PharmaceuticalFormResponse>>(`/api/v1/pharmaceutical-forms/UpdatePharmaceuticalFormById/${id}`, { name, description });
    }

    deletePharmaceuticalFormById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/pharmaceutical-forms/DeletePharmaceuticalFormById/${id}`);
    }

    getAllTherapeuticActions(): Observable<ResponseApi<TherapeuticActionResponse[]>> {
        if (!this.therapeuticActionsCache$) {
            this.therapeuticActionsCache$ = this.http.get<ResponseApi<TherapeuticActionResponse[]>>('/api/v1/therapeutic-actions/GetAllTherapeuticActions').pipe(shareReplay(1));
        }
        return this.therapeuticActionsCache$;
    }

    createNewTherapeuticAction(name: string, description?: string): Observable<ResponseApi<TherapeuticActionResponse>> {
        return this.http.post<ResponseApi<TherapeuticActionResponse>>('/api/v1/therapeutic-actions/CreateNewTherapeuticAction', { name, description });
    }

    updateTherapeuticActionById(id: number, name: string, description?: string): Observable<ResponseApi<TherapeuticActionResponse>> {
        return this.http.put<ResponseApi<TherapeuticActionResponse>>(`/api/v1/therapeutic-actions/UpdateTherapeuticActionById/${id}`, { name, description });
    }

    deleteTherapeuticActionById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/therapeutic-actions/DeleteTherapeuticActionById/${id}`);
    }

    invalidateAllCaches(): void {
        this.brandsCache$ = undefined;
        this.categoriesCache$ = undefined;
        this.laboratoriesCache$ = undefined;
        this.presentationsCache$ = undefined;
        this.taxTypesCache$ = undefined;
        this.activeIngredientsCache$ = undefined;
        this.pharmaceuticalFormsCache$ = undefined;
        this.therapeuticActionsCache$ = undefined;
    }


}
