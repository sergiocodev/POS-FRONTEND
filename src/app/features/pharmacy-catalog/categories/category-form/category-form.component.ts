import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { CategoryRequest } from '../../../../core/models/category.model';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';

@Component({
    selector: 'app-category-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './category-form.component.html',
    styleUrl: './category-form.component.scss'
})
export class CategoryFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private maintenanceService = inject(MaintenanceService);
    private modalService = inject(ModalService);

    @Input() set categoryId(value: number | null) {
        this._categoryId.set(value);
        this.checkEditModeFromInput();
    }
    get categoryId(): number | null {
        return this._categoryId();
    }
    private _categoryId = signal<number | null>(null);

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
            name: ['', [Validators.required, Validators.maxLength(150)]]
        });
    }

    checkEditModeFromInput() {
        const id = this.categoryId;
        if (id) {
            this.isEditMode.set(true);
            this.loadCategory(id);
        } else {
            this.isEditMode.set(false);
            if (this.form) {
                this.form.reset();
            }
        }
    }

    loadCategory(id: number) {
        this.isLoading.set(true);
        this.maintenanceService.getAllCategory().subscribe({
            next: (response) => {
                const category = response.data.find(c => c.id === id);
                if (category) {
                    this.form.patchValue({
                        name: category.name
                    });
                } else {
                    this.modalService.alert({ title: 'Error', message: 'Categoría no encontrada', type: 'error' });
                    this.cancelled.emit();
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading category:', error);
                this.modalService.alert({ title: 'Error', message: 'Error al cargar la categoría', type: 'error' });
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
        const request: CategoryRequest = this.form.value;

        const operation = this.isEditMode()
            ? this.maintenanceService.updateCategoryById(this._categoryId()!, request.name)
            : this.maintenanceService.createNewCategory(request.name);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
            },
            error: (error) => {
                console.error('Error saving category:', error);
                this.modalService.alert({ title: 'Error', message: 'Error al guardar la categoría', type: 'error' });
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
