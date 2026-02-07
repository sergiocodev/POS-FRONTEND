
import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { TherapeuticActionRequest } from '../../../../core/models/therapeutic-action.model';

@Component({
    selector: 'app-therapeutic-action-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './therapeutic-action-form.component.html',
    styleUrl: './therapeutic-action-form.component.scss'
})
export class TherapeuticActionFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    @Input() set formId(value: number | null) {
        this._formId.set(value);
        this.checkEditModeFromInput();
    }
    get formId(): number | null {
        return this._formId();
    }
    private _formId = signal<number | null>(null);

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
            name: ['', [Validators.required, Validators.maxLength(150)]],
            description: ['', [Validators.maxLength(255)]],
            active: [true]
        });
    }

    checkEditModeFromRoute() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this._formId.set(+id);
            this.loadForm(+id);
        }
    }

    checkEditModeFromInput() {
        const id = this.formId;
        if (id) {
            this.isEditMode.set(true);
            this.loadForm(id);
        } else {
            this.isEditMode.set(false);
            if (this.form) {
                this.form.reset({ active: true });
            }
        }
    }

    loadForm(id: number) {
        this.isLoading.set(true);
        this.maintenanceService.getTherapeuticActions().subscribe({
            next: (response) => {
                const form = response.data.find(i => i.id === id);
                if (form) {
                    this.form.patchValue({
                        name: form.name,
                        description: form.description || '',
                        active: form.active
                    });
                } else {
                    alert('Acción terapéutica no encontrada');
                    this.router.navigate(['/pharmacy/therapeutic-actions']);
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading form:', error);
                alert('Error al cargar el registro');
                this.router.navigate(['/pharmacy/therapeutic-actions']);
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
        const request: TherapeuticActionRequest = this.form.value;

        const operation = this.isEditMode()
            ? this.maintenanceService.updateTherapeuticAction(
                this.formId!,
                request.name,
                request.description,
                request.active
            )
            : this.maintenanceService.createTherapeuticAction(
                request.name,
                request.description,
                request.active
            );

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
                if (this.route.snapshot.paramMap.get('id') || this.router.url.includes('/new')) {
                    this.router.navigate(['/pharmacy/therapeutic-actions']);
                }
            },
            error: (error) => {
                console.error('Error saving form:', error);
                alert('Error al guardar el registro');
                this.isSaving.set(false);
            }
        });
    }

    onCancel() {
        this.cancelled.emit();
        if (this.route.snapshot.paramMap.get('id') || this.router.url.includes('/new')) {
            this.router.navigate(['/pharmacy/therapeutic-actions']);
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
