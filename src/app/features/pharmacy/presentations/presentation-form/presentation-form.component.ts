import { Component, OnInit, inject, signal } from '@angular/core';
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

    form!: FormGroup;
    isEditMode = signal(false);
    presentationId = signal<number | null>(null);
    isLoading = signal(false);
    isSaving = signal(false);

    ngOnInit() {
        this.initForm();
        this.checkEditMode();
    }

    initForm() {
        this.form = this.fb.group({
            description: ['', [Validators.required, Validators.maxLength(100)]]
        });
    }

    checkEditMode() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.presentationId.set(+id);
            this.loadPresentation(+id);
        }
    }

    loadPresentation(id: number) {
        this.isLoading.set(true);
        this.maintenanceService.getPresentations().subscribe({
            next: (presentations) => {
                const presentation = presentations.find(p => p.id === id);
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
            ? this.maintenanceService.updatePresentation(this.presentationId()!, request.description)
            : this.maintenanceService.createPresentation(request.description);

        operation.subscribe({
            next: () => {
                this.router.navigate(['/pharmacy/presentations']);
            },
            error: (error) => {
                console.error('Error saving presentation:', error);
                alert('Error al guardar la presentación');
                this.isSaving.set(false);
            }
        });
    }

    onCancel() {
        this.router.navigate(['/pharmacy/presentations']);
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
