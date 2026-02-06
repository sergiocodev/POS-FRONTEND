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
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/roles';

    getAll(): Observable<ResponseApi<RoleResponse[]>> {
        return this.http.get<ResponseApi<RoleResponse[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ResponseApi<RoleDetailResponse>> {
        return this.http.get<ResponseApi<RoleDetailResponse>>(`${this.apiUrl}/${id}`);
    }

    create(request: RoleRequest): Observable<ResponseApi<RoleDetailResponse>> {
        return this.http.post<ResponseApi<RoleDetailResponse>>(this.apiUrl, request);
    }

    update(id: number, request: RoleRequest): Observable<ResponseApi<RoleDetailResponse>> {
        return this.http.put<ResponseApi<RoleDetailResponse>>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.apiUrl}/${id}`);
    }

    toggleActive(id: number): Observable<ResponseApi<RoleResponse>> {
        return this.http.patch<ResponseApi<RoleResponse>>(`${this.apiUrl}/${id}/toggle-active`, {});
    }



    getPermissions(roleId: number): Observable<ResponseApi<PermissionResponse[]>> {
        return this.http.get<ResponseApi<PermissionResponse[]>>(`${this.apiUrl}/${roleId}/permissions`);
    }

    assignPermissions(roleId: number, request: AssignPermissionsRequest): Observable<ResponseApi<RoleDetailResponse>> {
        return this.http.post<ResponseApi<RoleDetailResponse>>(`${this.apiUrl}/${roleId}/permissions`, request);
    }

    replacePermissions(roleId: number, request: AssignPermissionsRequest): Observable<ResponseApi<RoleDetailResponse>> {
        return this.http.put<ResponseApi<RoleDetailResponse>>(`${this.apiUrl}/${roleId}/permissions`, request);
    }

    removePermission(roleId: number, permissionId: number): Observable<ResponseApi<RoleDetailResponse>> {
        return this.http.delete<ResponseApi<RoleDetailResponse>>(`${this.apiUrl}/${roleId}/permissions/${permissionId}`);
    }

    removePermissions(roleId: number, request: AssignPermissionsRequest): Observable<ResponseApi<RoleDetailResponse>> {
        return this.http.post<ResponseApi<RoleDetailResponse>>(`${this.apiUrl}/${roleId}/permissions/batch-remove`, request);
    }
}
