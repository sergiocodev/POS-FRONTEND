import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { PresentationRequest } from '../../../../core/models/presentation.model';

@Component({
    selector: 'app-presentation-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './presentation-form.component.html',
    styleUrl: './presentation-form.component.scss'
})
export class PresentationFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    @Input() set idPresentation(value: number | null) {
        this._presentationId.set(value);
        this.checkEditModeFromInput();
    }
    get idPresentation(): number | null {
        return this._presentationId();
    }
    private _presentationId = signal<number | null>(null);

    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    form!: FormGroup;
    isEditMode = signal(false);
    isLoading = signal(false);
    isSaving = signal(false);

    ngOnInit() {
        this.initForm();
        this.checkEditModeFromRoute();
    }

    initForm() {
        this.form = this.fb.group({
            description: ['', [Validators.required, Validators.maxLength(100)]]
        });
    }

    checkEditModeFromRoute() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this._presentationId.set(+id);
            this.loadPresentation(+id);
        }
    }

    checkEditModeFromInput() {
        const id = this.idPresentation;
        if (id) {
            this.isEditMode.set(true);
            this.loadPresentation(id);
        } else {
            this.isEditMode.set(false);
            if (this.form) {
                this.form.reset();
            }
        }
    }

    loadPresentation(id: number) {
        this.isLoading.set(true);
        this.maintenanceService.getPresentations().subscribe({
            next: (response) => {
                const presentation = response.data.find(p => p.id === id);
                if (presentation) {
                    this.form.patchValue({
                        description: presentation.description
                    });
                } else {
                    alert('Presentación no encontrada');
                    this.router.navigate(['/pharmacy/presentations']);
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading presentation:', error);
                alert('Error al cargar la presentación');
                this.router.navigate(['/pharmacy/presentations']);
                this.isLoading.set(false);
            }
        });
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isSaving.set(true);
        const request: PresentationRequest = this.form.value;

        const operation = this.isEditMode()
            ? this.maintenanceService.updatePresentation(this._presentationId()!, request.description)
            : this.maintenanceService.createPresentation(request.description);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
                // Si aún estamos en modo ruta (no modal), navegar
                if (this.route.snapshot.paramMap.get('id') || this.router.url.includes('/new')) {
                    this.router.navigate(['/pharmacy/presentations']);
                }
            },
            error: (error) => {
                console.error('Error saving presentation:', error);
                alert('Error al guardar la presentación');
                this.isSaving.set(false);
            }
        });
    }

    onCancel() {
        this.cancelled.emit();
        if (this.route.snapshot.paramMap.get('id') || this.router.url.includes('/new')) {
            this.router.navigate(['/pharmacy/presentations']);
        }
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.form.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    getFieldError(fieldName: string): string {
        const field = this.form.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'Este campo es requerido';
            if (field.errors['maxlength']) {
                return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
            }
        }
        return '';
    }
}
