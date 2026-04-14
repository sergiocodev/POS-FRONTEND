import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Error boundary component. Wraps feature modules and shows a friendly
 * error state when something goes wrong, with a retry button.
 *
 * Usage:
 *   <app-error-boundary [hasError]="loadError" (retry)="reload()">
 *     <app-feature-content />
 *   </app-error-boundary>
 */
@Component({
    selector: 'app-error-boundary',
    standalone: true,
    imports: [CommonModule],
    template: `
        @if (hasError()) {
        <div class="error-boundary d-flex flex-column align-items-center justify-content-center py-5">
            <i class="bi bi-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
            <h5 class="fw-bold mb-2">{{ title() }}</h5>
            <p class="text-muted text-center mb-3" style="max-width: 400px;">
                {{ message() }}
            </p>
            @if (showRetry()) {
            <button class="btn btn-primary btn-sm" (click)="retry.emit()">
                <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
            </button>
            }
        </div>
        } @else {
        <ng-content />
        }
    `,
    styles: [`
        .error-boundary {
            background: var(--bs-body-bg);
            border-radius: 0.75rem;
            border: 1px solid var(--bs-border-color);
        }
    `]
})
export class ErrorBoundaryComponent {
    hasError = input<boolean>(false);
    title = input<string>('Algo salio mal');
    message = input<string>('No se pudo cargar esta seccion. Por favor, intenta de nuevo.');
    showRetry = input<boolean>(true);
    retry = output<void>();
}
