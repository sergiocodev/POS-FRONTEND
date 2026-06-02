import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';

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
    private modalService = inject(ModalService);

    @Input() set presentationId(value: number | null) {
        this._presentationId.set(value);
        this.checkEditModeFromInput();
    }
    get presentationId(): number | null {
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
    }

    initForm() {
        this.form = this.fb.group({
            description: ['', [Validators.required, Validators.maxLength(150)]]
        });
    }

    checkEditModeFromInput() {
        const id = this.presentationId;
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
        this.maintenanceService.getAllPresentations().subscribe({
            next: (response) => {
                const presentation = response.data.find(p => p.id === id);
                if (presentation) {
                    this.form.patchValue({
                        description: presentation.description
                    });
                } else {
                    this.modalService.alert({ title: 'Error', message: 'Presentación no encontrada', type: 'error' });
                    this.cancelled.emit();
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading presentation:', error);
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
        const description = this.form.value.description;

        const operation = this.isEditMode()
            ? this.maintenanceService.updatePresentationById(this.presentationId!, description)
            : this.maintenanceService.createNewPresentation(description);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
            },
            error: (error) => {
                console.error('Error saving presentation:', error);
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
