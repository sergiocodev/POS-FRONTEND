import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { LaboratoryRequest } from '../../../../core/models/laboratory.model';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';

@Component({
    selector: 'app-laboratory-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './laboratory-form.component.html',
    styleUrl: './laboratory-form.component.scss'
})
export class LaboratoryFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

    @Input() set laboratoryId(value: number | null) {
        this._laboratoryId.set(value);
        this.checkEditModeFromInput();
    }
    get laboratoryId(): number | null {
        return this._laboratoryId();
    }
    private _laboratoryId = signal<number | null>(null);

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
            name: ['', [Validators.required, Validators.maxLength(200)]]
        });
    }

    checkEditModeFromInput() {
        const id = this.laboratoryId;
        if (id) {
            this.isEditMode.set(true);
            this.loadLaboratory(id);
        } else {
            this.isEditMode.set(false);
            if (this.form) {
                this.form.reset();
            }
        }
    }

    loadLaboratory(id: number) {
        this.isLoading.set(true);
        this.maintenanceService.getAllLaboratory().subscribe({
            next: (response) => {
                const laboratory = response.data.find(l => l.id === id);
                if (laboratory) {
                    this.form.patchValue({
                        name: laboratory.name
                    });
                } else {
                    this.modalService.alert({ title: 'Error', message: 'Laboratorio no encontrado', type: 'error' });
                    this.cancelled.emit();
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading laboratory:', error);
                this.modalService.alert({ title: 'Error', message: 'Error al cargar el laboratorio', type: 'error' });
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
        const request: LaboratoryRequest = this.form.value;

        const operation = this.isEditMode()
            ? this.maintenanceService.updateLaboratoryById(this._laboratoryId()!, request.name)
            : this.maintenanceService.createNewLaboratory(request.name);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
            },
            error: (error) => {
                console.error('Error saving laboratory:', error);
                this.modalService.alert({ title: 'Error', message: 'Error al guardar el laboratorio', type: 'error' });
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
