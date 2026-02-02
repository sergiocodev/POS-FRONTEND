import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoleRequest, RoleResponse, PermissionResponse } from '../models/maintenance.model';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/roles';

    getAll(): Observable<RoleResponse[]> {
        return this.http.get<RoleResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<RoleResponse> {
        return this.http.get<RoleResponse>(`${this.apiUrl}/${id}`);
    }

    create(request: RoleRequest): Observable<RoleResponse> {
        return this.http.post<RoleResponse>(this.apiUrl, request);
    }

    update(id: number, request: RoleRequest): Observable<RoleResponse> {
        return this.http.put<RoleResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getPermissions(): Observable<PermissionResponse[]> {
        return this.http.get<PermissionResponse[]>('/api/v1/permissions');
    }

    assignPermissions(roleId: number, permissionIds: number[]): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${roleId}/permissions`, { permissionIds });
    }
}
