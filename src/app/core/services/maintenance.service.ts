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
import { PharmaceuticalFormResponse } from '../models/pharmaceutical-form.model';
import { TherapeuticActionResponse } from '../models/therapeutic-action.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class MaintenanceService {
    private http = inject(HttpClient);

    getAllBrands(): Observable<ResponseApi<BrandResponse[]>> {
        return this.http.get<ResponseApi<BrandResponse[]>>('/api/v1/brands/GetAllBrands');
    }

    createNewBrand(name: string, active: boolean = true): Observable<ResponseApi<BrandResponse>> {
        return this.http.post<ResponseApi<BrandResponse>>('/api/v1/brands/CreateNewBrand', { name, active });
    }

    updateBrandById(id: number, name: string, active: boolean): Observable<ResponseApi<BrandResponse>> {
        return this.http.put<ResponseApi<BrandResponse>>(`/api/v1/brands/UpdateBrandById/${id}`, { name, active });
    }

    deleteBrandById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/brands/DeleteBrandById/${id}`);
    }

    getAllCategory(): Observable<ResponseApi<CategoryResponse[]>> {
        return this.http.get<ResponseApi<CategoryResponse[]>>('/api/v1/category/GetAllCategory');
    }

    createNewCategory(name: string, active: boolean = true): Observable<ResponseApi<CategoryResponse>> {
        return this.http.post<ResponseApi<CategoryResponse>>('/api/v1/category/CreateNewCategory', { name, active });
    }

    updateCategoryById(id: number, name: string, active: boolean): Observable<ResponseApi<CategoryResponse>> {
        return this.http.put<ResponseApi<CategoryResponse>>(`/api/v1/category/UpdateCategoryById/${id}`, { name, active });
    }

    deleteCategoryById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/category/DeleteCategoryById/${id}`);
    }

    getAllLaboratory(): Observable<ResponseApi<LaboratoryResponse[]>> {
        return this.http.get<ResponseApi<LaboratoryResponse[]>>('/api/v1/laboratory/GetAllLaboratory');
    }

    createNewLaboratory(name: string, active: boolean = true): Observable<ResponseApi<LaboratoryResponse>> {
        return this.http.post<ResponseApi<LaboratoryResponse>>('/api/v1/laboratory/CreateNewLaboratory', { name, active });
    }

    updateLaboratoryById(id: number, name: string, active: boolean): Observable<ResponseApi<LaboratoryResponse>> {
        return this.http.put<ResponseApi<LaboratoryResponse>>(`/api/v1/laboratory/UpdateLaboratoryById/${id}`, { name, active });
    }

    deleteLaboratoryById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/laboratory/DeleteLaboratoryById/${id}`);
    }

    getAllPresentations(): Observable<ResponseApi<PresentationResponse[]>> {
        return this.http.get<ResponseApi<PresentationResponse[]>>('/api/v1/presentations/GetAllPresentations');
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
        return this.http.get<ResponseApi<TaxTypeResponse[]>>('/api/v1/tax-types/GetAllTaxTypes');
    }

    createNewTaxType(name: string, rate: number, codeSunat?: string, active: boolean = true): Observable<ResponseApi<TaxTypeResponse>> {
        return this.http.post<ResponseApi<TaxTypeResponse>>('/api/v1/tax-types/CreateNewTaxType', { name, rate, codeSunat, active });
    }

    updateTaxTypeById(id: number, name: string, rate: number, codeSunat?: string, active?: boolean): Observable<ResponseApi<TaxTypeResponse>> {
        return this.http.put<ResponseApi<TaxTypeResponse>>(`/api/v1/tax-types/UpdateTaxTypeById/${id}`, { name, rate, codeSunat, active });
    }

    deleteTaxTypeById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/tax-types/DeleteTaxTypeById/${id}`);
    }

    getAllActiveIngredients(): Observable<ResponseApi<ActiveIngredientResponse[]>> {
        return this.http.get<ResponseApi<ActiveIngredientResponse[]>>('/api/v1/active-ingredients/GetAllActiveIngredients');
    }

    createNewActiveIngredient(name: string, description?: string, active: boolean = true): Observable<ResponseApi<ActiveIngredientResponse>> {
        return this.http.post<ResponseApi<ActiveIngredientResponse>>('/api/v1/active-ingredients/CreateNewActiveIngredient', { name, description, active });
    }

    updateActiveIngredientById(id: number, name: string, description?: string, active?: boolean): Observable<ResponseApi<ActiveIngredientResponse>> {
        return this.http.put<ResponseApi<ActiveIngredientResponse>>(`/api/v1/active-ingredients/UpdateActiveIngredientById/${id}`, { name, description, active });
    }

    deleteActiveIngredientById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/active-ingredients/DeleteActiveIngredientById/${id}`);
    }

    getAllPharmaceuticalForms(): Observable<ResponseApi<PharmaceuticalFormResponse[]>> {
        return this.http.get<ResponseApi<PharmaceuticalFormResponse[]>>('/api/v1/pharmaceutical-forms/GetAllPharmaceuticalForms');
    }

    createNewPharmaceuticalForm(name: string, description?: string, active: boolean = true): Observable<ResponseApi<PharmaceuticalFormResponse>> {
        return this.http.post<ResponseApi<PharmaceuticalFormResponse>>('/api/v1/pharmaceutical-forms/CreateNewPharmaceuticalForm', { name, description, active });
    }

    updatePharmaceuticalFormById(id: number, name: string, description?: string, active?: boolean): Observable<ResponseApi<PharmaceuticalFormResponse>> {
        return this.http.put<ResponseApi<PharmaceuticalFormResponse>>(`/api/v1/pharmaceutical-forms/UpdatePharmaceuticalFormById/${id}`, { name, description, active });
    }

    deletePharmaceuticalFormById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/pharmaceutical-forms/DeletePharmaceuticalFormById/${id}`);
    }

    getAllTherapeuticActions(): Observable<ResponseApi<TherapeuticActionResponse[]>> {
        return this.http.get<ResponseApi<TherapeuticActionResponse[]>>('/api/v1/therapeutic-actions/GetAllTherapeuticActions');
    }

    createNewTherapeuticAction(name: string, description?: string, active: boolean = true): Observable<ResponseApi<TherapeuticActionResponse>> {
        return this.http.post<ResponseApi<TherapeuticActionResponse>>('/api/v1/therapeutic-actions/CreateNewTherapeuticAction', { name, description, active });
    }

    updateTherapeuticActionById(id: number, name: string, description?: string, active?: boolean): Observable<ResponseApi<TherapeuticActionResponse>> {
        return this.http.put<ResponseApi<TherapeuticActionResponse>>(`/api/v1/therapeutic-actions/UpdateTherapeuticActionById/${id}`, { name, description, active });
    }

    deleteTherapeuticActionById(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`/api/v1/therapeutic-actions/DeleteTherapeuticActionById/${id}`);
    }


}
