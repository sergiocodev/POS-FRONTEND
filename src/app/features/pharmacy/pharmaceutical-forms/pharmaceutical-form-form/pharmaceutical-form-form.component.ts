import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { PharmaceuticalFormRequest } from '../../../../core/models/pharmaceutical-form.model';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';

@Component({
    selector: 'app-pharmaceutical-form-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './pharmaceutical-form-form.component.html',
    styleUrl: './pharmaceutical-form-form.component.scss'
})
export class PharmaceuticalFormFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

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
    }

    initForm() {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(150)]],
            description: ['', [Validators.maxLength(255)]],
            active: [true]
        });
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
        this.maintenanceService.getAllPharmaceuticalForms().subscribe({
            next: (response) => {
                const form = response.data.find(i => i.id === id);
                if (form) {
                    this.form.patchValue({
                        name: form.name,
                        description: form.description || '',
                        active: form.active
                    });
                } else {
                    this.modalService.alert({ title: 'Error', message: 'Forma farmacéutica no encontrada', type: 'error' });
                    this.cancelled.emit();
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading form:', error);
                this.modalService.alert({ title: 'Error', message: 'Error al cargar el registro', type: 'error' });
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
        const request: PharmaceuticalFormRequest = this.form.value;

        const operation = this.isEditMode()
            ? this.maintenanceService.updatePharmaceuticalFormById(
                this.formId!,
                request.name,
                request.description,
                request.active
            )
            : this.maintenanceService.createNewPharmaceuticalForm(
                request.name,
                request.description,
                request.active
            );

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
            },
            error: (error) => {
                console.error('Error saving form:', error);
                this.modalService.alert({ title: 'Error', message: 'Error al guardar el registro', type: 'error' });
                this.isSaving.set(false);
            }
        });
    }

    onCancel() {
        this.cancelled.emit();
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
