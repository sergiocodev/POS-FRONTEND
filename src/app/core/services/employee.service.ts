import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { EmployeeRequest, EmployeeResponse } from '../models/employee.model';
import { ResponseApi } from '../models/response-api.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/employees`;

    private cache$?: Observable<ResponseApi<EmployeeResponse[]>>;

    getAll(): Observable<ResponseApi<EmployeeResponse[]>> {
        if (!this.cache$) {
            this.cache$ = this.http.get<ResponseApi<EmployeeResponse[]>>(this.apiUrl).pipe(shareReplay(1));
        }
        return this.cache$;
    }

    getAllPaged(page: number, size: number, filters?: any): Observable<ResponseApi<any>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params = params.set(key, filters[key]);
                }
            });
        }
        return this.http.get<ResponseApi<any>>(`${this.apiUrl}/paged`, { params });
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

    invalidateCache(): void {
        this.cache$ = undefined;
    }
}
