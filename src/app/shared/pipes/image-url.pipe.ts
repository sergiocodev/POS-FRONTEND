import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
      return value;
    }
    const baseUrl = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
    // Ensure the value starts with a slash
    const path = value.startsWith('/') ? value : `/${value}`;
    return `${baseUrl}${path}`;
  }
}
