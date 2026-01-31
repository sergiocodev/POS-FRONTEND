import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmployeeRequest, EmployeeResponse } from '../models/employee.model';

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private http = inject(HttpClient);
    private apiUrl = '/api/employees';

    getAll(): Observable<EmployeeResponse[]> {
        return this.http.get<EmployeeResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<EmployeeResponse> {
        return this.http.get<EmployeeResponse>(`${this.apiUrl}/${id}`);
    }

    create(request: EmployeeRequest): Observable<EmployeeResponse> {
        return this.http.post<EmployeeResponse>(this.apiUrl, request);
    }

    update(id: number, request: EmployeeRequest): Observable<EmployeeResponse> {
        return this.http.put<EmployeeResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
