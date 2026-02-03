import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { BrandRequest } from '../../../../core/models/brand.model';

@Component({
    selector: 'app-brand-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './brand-form.component.html',
    styleUrl: './brand-form.component.scss'
})
export class BrandFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private maintenanceService = inject(MaintenanceService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    form!: FormGroup;
    isEditMode = signal(false);
    brandId = signal<number | null>(null);
    isLoading = signal(false);
    isSaving = signal(false);

    ngOnInit() {
        this.initForm();
        this.checkEditMode();
    }

    initForm() {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
            active: [true]
        });
    }

    checkEditMode() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.brandId.set(+id);
            this.loadBrand(+id);
        }
    }

    loadBrand(id: number) {
        this.isLoading.set(true);
        this.maintenanceService.getBrands().subscribe({
            next: (brands) => {
                const brand = brands.find(b => b.id === id);
                if (brand) {
                    this.form.patchValue({
                        name: brand.name,
                        active: brand.active
                    });
                } else {
                    alert('Marca no encontrada');
                    this.router.navigate(['/pharmacy/brands']);
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading brand:', error);
                alert('Error al cargar la marca');
                this.router.navigate(['/pharmacy/brands']);
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
        const request: BrandRequest = this.form.value;

        const operation = this.isEditMode()
            ? this.maintenanceService.updateBrand(this.brandId()!, request.name, request.active)
            : this.maintenanceService.createBrand(request.name, request.active);

        operation.subscribe({
            next: () => {
                this.router.navigate(['/pharmacy/brands']);
            },
            error: (error) => {
                console.error('Error saving brand:', error);
                alert('Error al guardar la marca');
                this.isSaving.set(false);
            }
        });
    }

    onCancel() {
        this.router.navigate(['/pharmacy/brands']);
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.form.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    getFieldError(fieldName: string): string {
        const field = this.form.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'Este campo es requerido';
            if (field.errors['minlength']) {
                return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
            }
            if (field.errors['maxlength']) {
                return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
            }
        }
        return '';
    }
}
