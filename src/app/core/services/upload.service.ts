import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '../models/response-api.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UploadService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/uploads`;

    upload(file: File, folder: string): Observable<ResponseApi<{ url: string }>> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        return this.http.post<ResponseApi<{ url: string }>>(this.apiUrl, formData);
    }
}
