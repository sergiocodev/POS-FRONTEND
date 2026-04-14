import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { UserRequest, UserResponse, UserAssignRolesRequest, UserAssignEstablishmentsRequest, ExternalLookupResponse } from '../models/user.model';
import { ResponseApi } from '../models/response-api.model';


@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/users';

    private cache$?: Observable<ResponseApi<UserResponse[]>>;

    getAll(): Observable<ResponseApi<UserResponse[]>> {
        if (!this.cache$) {
            this.cache$ = this.http.get<ResponseApi<UserResponse[]>>(this.apiUrl).pipe(shareReplay(1));
        }
        return this.cache$;
    }

    getById(id: number): Observable<ResponseApi<UserResponse>> {
        return this.http.get<ResponseApi<UserResponse>>(`${this.apiUrl}/${id}`);
    }

    create(request: UserRequest): Observable<ResponseApi<UserResponse>> {
        return this.http.post<ResponseApi<UserResponse>>(this.apiUrl, request);
    }

    update(id: number, request: UserRequest): Observable<ResponseApi<UserResponse>> {
        return this.http.put<ResponseApi<UserResponse>>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.apiUrl}/${id}`);
    }

    assignRoles(userId: number, request: UserAssignRolesRequest): Observable<ResponseApi<UserResponse>> {
        return this.http.post<ResponseApi<UserResponse>>(`${this.apiUrl}/${userId}/roles`, request);
    }

    assignEstablishments(userId: number, request: UserAssignEstablishmentsRequest): Observable<ResponseApi<UserResponse>> {
        return this.http.post<ResponseApi<UserResponse>>(`${this.apiUrl}/${userId}/establishments`, request);
    }

    searchByDocument(documentNumber: string): Observable<ResponseApi<ExternalLookupResponse>> {
        return this.http.get<ResponseApi<ExternalLookupResponse>>(`${this.apiUrl}/search/${documentNumber}`);
    }

    invalidateCache(): void {
        this.cache$ = undefined;
    }
}
