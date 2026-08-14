import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import {
    RoleRequest,
    RoleResponse,
    RoleDetailResponse,
    PermissionResponse,
    AssignPermissionsRequest
} from '../models/maintenance.model';
import { ResponseApi } from '../models/response-api.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/roles`;

    private cache$?: Observable<ResponseApi<RoleResponse[]>>;

    getAll(): Observable<ResponseApi<RoleResponse[]>> {
        if (!this.cache$) {
            this.cache$ = this.http.get<ResponseApi<RoleResponse[]>>(this.apiUrl).pipe(shareReplay(1));
        }
        return this.cache$;
    }

    getAllPaged(page: number, size: number, search?: string): Observable<ResponseApi<any>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        
        if (search) {
            params = params.set('search', search);
        }
        
        return this.http.get<ResponseApi<any>>(`${this.apiUrl}/paged`, { params });
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

    invalidateCache(): void {
        this.cache$ = undefined;
    }
}
