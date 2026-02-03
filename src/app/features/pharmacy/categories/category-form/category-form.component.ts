import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { CategoryRequest } from '../../../../core/models/category.model';

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
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    form!: FormGroup;
    isEditMode = signal(false);
    categoryId = signal<number | null>(null);
    isLoading = signal(false);
    isSaving = signal(false);

    ngOnInit() {
        this.initForm();
        this.checkEditMode();
    }

    initForm() {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(150)]],
            active: [true]
        });
    }

    checkEditMode() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.categoryId.set(+id);
            this.loadCategory(+id);
        }
    }

    loadCategory(id: number) {
        this.isLoading.set(true);
        this.maintenanceService.getCategories().subscribe({
            next: (categories) => {
                const category = categories.find(c => c.id === id);
                if (category) {
                    this.form.patchValue({
                        name: category.name,
                        active: category.active
                    });
                } else {
                    alert('Categoría no encontrada');
                    this.router.navigate(['/pharmacy/categories']);
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading category:', error);
                alert('Error al cargar la categoría');
                this.router.navigate(['/pharmacy/categories']);
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
            ? this.maintenanceService.updateCategory(this.categoryId()!, request.name, request.active)
            : this.maintenanceService.createCategory(request.name, request.active);

        operation.subscribe({
            next: () => {
                this.router.navigate(['/pharmacy/categories']);
            },
            error: (error) => {
                console.error('Error saving category:', error);
                alert('Error al guardar la categoría');
                this.isSaving.set(false);
            }
        });
    }

    onCancel() {
        this.router.navigate(['/pharmacy/categories']);
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
