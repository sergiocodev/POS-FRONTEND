import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { ActiveIngredientRequest } from '../../../../core/models/active-ingredient.model';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';

@Component({
    selector: 'app-active-ingredient-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './active-ingredient-form.component.html',
    styleUrl: './active-ingredient-form.component.scss'
})
export class ActiveIngredientFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

    @Input() set ingredientId(value: number | null) {
        this._ingredientId.set(value);
        this.checkEditModeFromInput();
    }
    get ingredientId(): number | null {
        return this._ingredientId();
    }
    private _ingredientId = signal<number | null>(null);

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
            name: ['', [Validators.required, Validators.maxLength(200)]],
            description: ['', [Validators.maxLength(255)]]
        });
    }

    checkEditModeFromInput() {
        const id = this.ingredientId;
        if (id) {
            this.isEditMode.set(true);
            this.loadActiveIngredient(id);
        } else {
            this.isEditMode.set(false);
            if (this.form) {
                this.form.reset();
            }
        }
    }

    loadActiveIngredient(id: number) {
        this.isLoading.set(true);
        this.maintenanceService.getAllActiveIngredients().subscribe({
            next: (response) => {
                const ingredient = response.data.find(i => i.id === id);
                if (ingredient) {
                    this.form.patchValue({
                        name: ingredient.name,
                        description: ingredient.description || ''
                    });
                } else {
                    this.modalService.alert({ title: 'Error', message: 'Principio activo no encontrado', type: 'error' });
                    this.cancelled.emit();
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading active ingredient:', error);
                this.modalService.alert({ title: 'Error', message: 'Error al cargar el principio activo', type: 'error' });
                this.cancelled.emit();
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
        const request: ActiveIngredientRequest = this.form.value;

        const operation = this.isEditMode()
            ? this.maintenanceService.updateActiveIngredientById(this.ingredientId!, request.name, request.description)
            : this.maintenanceService.createNewActiveIngredient(request.name, request.description);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.modalService.alert({
                    title: 'Éxito',
                    message: `Principio activo ${this.isEditMode() ? 'actualizado' : 'creado'} correctamente`,
                    type: 'success'
                });
                this.saved.emit();
            },
            error: (error) => {
                console.error('Error saving active ingredient:', error);
                this.modalService.alert({ title: 'Error', message: 'Error al guardar el principio activo', type: 'error' });
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
