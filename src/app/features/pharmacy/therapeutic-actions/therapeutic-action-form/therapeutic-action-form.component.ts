import { Component, OnInit, inject, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';
import { TherapeuticActionRequest } from '../../../../core/models/therapeutic-action.model';

@Component({
    selector: 'app-therapeutic-action-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './therapeutic-action-form.component.html',
    styleUrl: './therapeutic-action-form.component.scss'
})
export class TherapeuticActionFormComponent implements OnInit, OnChanges {
    private fb = inject(FormBuilder);
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

    @Input() actionId: number | null = null;

    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    form!: FormGroup;
    isEditMode = signal(false);
    isLoading = signal(false);
    isSaving = signal(false);

    ngOnInit() {
        this.initForm();
        this.checkEditMode();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['actionId'] && !changes['actionId'].firstChange) {
            this.checkEditMode();
        }
    }

    initForm() {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(150)]],
            description: ['', [Validators.maxLength(255)]]
        });
    }

    checkEditMode() {
        if (this.actionId) {
            this.isEditMode.set(true);
            this.loadAction(this.actionId);
        } else {
            this.isEditMode.set(false);
            if (this.form) {
                this.form.reset();
            }
        }
    }

    loadAction(id: number) {
        this.isLoading.set(true);
        this.maintenanceService.getAllTherapeuticActions().subscribe({
            next: (response) => {
                const action = response.data.find(a => a.id === id);
                if (action) {
                    this.form.patchValue({
                        name: action.name,
                        description: action.description || ''
                    });
                } else {
                    this.modalService.alert({ title: 'Error', message: 'Acción terapéutica no encontrada', type: 'error' });
                    this.cancelled.emit();
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading action:', error);
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
        const request: TherapeuticActionRequest = this.form.value;

        const operation = this.isEditMode()
            ? this.maintenanceService.updateTherapeuticActionById(this.actionId!, request.name, request.description)
            : this.maintenanceService.createNewTherapeuticAction(request.name, request.description);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
            },
            error: (error) => {
                console.error('Error saving action:', error);
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
                const requiredLength = field.errors['maxlength'].requiredLength;
                return `Máximo ${requiredLength} caracteres`;
            }
        }
        return '';
    }
}
