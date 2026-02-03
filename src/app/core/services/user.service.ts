import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserRequest, UserResponse, UserAssignRolesRequest, UserAssignEstablishmentsRequest } from '../models/user.model';


export interface User {
    id: number;
    username: string;
    email: string;
    nombre: string;
    role: string;
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/users';

    getAll(): Observable<UserResponse[]> {
        return this.http.get<UserResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<UserResponse> {
        return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
    }

    create(request: UserRequest): Observable<UserResponse> {
        return this.http.post<UserResponse>(this.apiUrl, request);
    }

    update(id: number, request: UserRequest): Observable<UserResponse> {
        return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    assignRoles(userId: number, request: UserAssignRolesRequest): Observable<UserResponse> {
        return this.http.post<UserResponse>(`${this.apiUrl}/${userId}/roles`, request);
    }

    assignEstablishments(userId: number, request: UserAssignEstablishmentsRequest): Observable<UserResponse> {
        return this.http.post<UserResponse>(`${this.apiUrl}/${userId}/establishments`, request);
    }

    toggleActive(id: number): Observable<UserResponse> {
        return this.http.patch<UserResponse>(`${this.apiUrl}/${id}/toggle-active`, {});
    }
}
