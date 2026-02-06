import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmployeeRequest, EmployeeResponse } from '../models/employee.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/employees';

    getAll(): Observable<ResponseApi<EmployeeResponse[]>> {
        return this.http.get<ResponseApi<EmployeeResponse[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ResponseApi<EmployeeResponse>> {
        return this.http.get<ResponseApi<EmployeeResponse>>(`${this.apiUrl}/${id}`);
    }

    create(request: EmployeeRequest): Observable<ResponseApi<EmployeeResponse>> {
        return this.http.post<ResponseApi<EmployeeResponse>>(this.apiUrl, request);
    }

    update(id: number, request: EmployeeRequest): Observable<ResponseApi<EmployeeResponse>> {
        return this.http.put<ResponseApi<EmployeeResponse>>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.apiUrl}/${id}`);
    }
}
