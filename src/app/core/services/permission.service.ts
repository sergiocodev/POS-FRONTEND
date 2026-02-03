import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PermissionResponse, CreatePermissionRequest } from '../models/maintenance.model';

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/permissions';

    getAll(module?: string, search?: string): Observable<PermissionResponse[]> {
        let params = new HttpParams();

        if (module) {
            params = params.set('module', module);
        }

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<PermissionResponse[]>(this.apiUrl, { params });
    }

    getGrouped(): Observable<{ [module: string]: PermissionResponse[] }> {
        return this.http.get<{ [module: string]: PermissionResponse[] }>(`${this.apiUrl}/grouped`);
    }

    getModules(): Observable<string[]> {
        return this.http.get<string[]>(`${this.apiUrl}/modules`);
    }

    getById(id: number): Observable<PermissionResponse> {
        return this.http.get<PermissionResponse>(`${this.apiUrl}/${id}`);
    }

    create(request: CreatePermissionRequest): Observable<PermissionResponse> {
        return this.http.post<PermissionResponse>(this.apiUrl, request);
    }

    update(id: number, request: CreatePermissionRequest): Observable<PermissionResponse> {
        return this.http.put<PermissionResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
