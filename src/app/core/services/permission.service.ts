import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PermissionResponse, CreatePermissionRequest } from '../models/maintenance.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/permissions';

    getAll(module?: string, search?: string): Observable<ResponseApi<PermissionResponse[]>> {
        let params = new HttpParams();

        if (module) {
            params = params.set('module', module);
        }

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<ResponseApi<PermissionResponse[]>>(this.apiUrl, { params });
    }

    getGrouped(): Observable<ResponseApi<{ [module: string]: PermissionResponse[] }>> {
        return this.http.get<ResponseApi<{ [module: string]: PermissionResponse[] }>>(`${this.apiUrl}/grouped`);
    }

    getModules(): Observable<ResponseApi<string[]>> {
        return this.http.get<ResponseApi<string[]>>(`${this.apiUrl}/modules`);
    }

    getById(id: number): Observable<ResponseApi<PermissionResponse>> {
        return this.http.get<ResponseApi<PermissionResponse>>(`${this.apiUrl}/${id}`);
    }

    create(request: CreatePermissionRequest): Observable<ResponseApi<PermissionResponse>> {
        return this.http.post<ResponseApi<PermissionResponse>>(this.apiUrl, request);
    }

    update(id: number, request: CreatePermissionRequest): Observable<ResponseApi<PermissionResponse>> {
        return this.http.put<ResponseApi<PermissionResponse>>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.apiUrl}/${id}`);
    }
}
