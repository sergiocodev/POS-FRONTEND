import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    RoleRequest,
    RoleResponse,
    RoleDetailResponse,
    PermissionResponse,
    AssignPermissionsRequest
} from '../models/maintenance.model';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/roles';

    getAll(): Observable<RoleResponse[]> {
        return this.http.get<RoleResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<RoleDetailResponse> {
        return this.http.get<RoleDetailResponse>(`${this.apiUrl}/${id}`);
    }

    create(request: RoleRequest): Observable<RoleDetailResponse> {
        return this.http.post<RoleDetailResponse>(this.apiUrl, request);
    }

    update(id: number, request: RoleRequest): Observable<RoleDetailResponse> {
        return this.http.put<RoleDetailResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    toggleActive(id: number): Observable<RoleResponse> {
        return this.http.patch<RoleResponse>(`${this.apiUrl}/${id}/toggle-active`, {});
    }

    // ==================== Permission Management ====================

    getPermissions(roleId: number): Observable<PermissionResponse[]> {
        return this.http.get<PermissionResponse[]>(`${this.apiUrl}/${roleId}/permissions`);
    }

    assignPermissions(roleId: number, request: AssignPermissionsRequest): Observable<RoleDetailResponse> {
        return this.http.post<RoleDetailResponse>(`${this.apiUrl}/${roleId}/permissions`, request);
    }

    replacePermissions(roleId: number, request: AssignPermissionsRequest): Observable<RoleDetailResponse> {
        return this.http.put<RoleDetailResponse>(`${this.apiUrl}/${roleId}/permissions`, request);
    }

    removePermission(roleId: number, permissionId: number): Observable<RoleDetailResponse> {
        return this.http.delete<RoleDetailResponse>(`${this.apiUrl}/${roleId}/permissions/${permissionId}`);
    }

    removePermissions(roleId: number, request: AssignPermissionsRequest): Observable<RoleDetailResponse> {
        return this.http.post<RoleDetailResponse>(`${this.apiUrl}/${roleId}/permissions/batch-remove`, request);
    }
}
