import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { ActiveIngredientRequest } from '../../../../core/models/active-ingredient.model';

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
    private router = inject(Router);
    private route = inject(ActivatedRoute);

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
        this.checkEditModeFromRoute();
    }

    initForm() {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(200)]],
            description: ['', [Validators.maxLength(255)]],
            active: [true]
        });
    }

    checkEditModeFromRoute() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this._ingredientId.set(+id);
            this.loadActiveIngredient(+id);
        }
    }

    checkEditModeFromInput() {
        const id = this.ingredientId;
        if (id) {
            this.isEditMode.set(true);
            this.loadActiveIngredient(id);
        } else {
            this.isEditMode.set(false);
            if (this.form) {
                this.form.reset({ active: true });
            }
        }
    }

    loadActiveIngredient(id: number) {
        this.isLoading.set(true);
        this.maintenanceService.getActiveIngredients().subscribe({
            next: (response) => {
                const ingredient = response.data.find(i => i.id === id);
                if (ingredient) {
                    this.form.patchValue({
                        name: ingredient.name,
                        description: ingredient.description || '',
                        active: ingredient.active
                    });
                } else {
                    alert('Principio activo no encontrado');
                    this.router.navigate(['/pharmacy/active-ingredients']);
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading active ingredient:', error);
                alert('Error al cargar el principio activo');
                this.router.navigate(['/pharmacy/active-ingredients']);
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
            ? this.maintenanceService.updateActiveIngredient(
                this.ingredientId!,
                request.name,
                request.description,
                request.active
            )
            : this.maintenanceService.createActiveIngredient(
                request.name,
                request.description,
                request.active
            );

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
                // Si aún estamos en modo ruta (no modal), navegar
                if (this.route.snapshot.paramMap.get('id') || this.router.url.includes('/new')) {
                    this.router.navigate(['/pharmacy/active-ingredients']);
                }
            },
            error: (error) => {
                console.error('Error saving active ingredient:', error);
                alert('Error al guardar el principio activo');
                this.isSaving.set(false);
            }
        });
    }

    onCancel() {
        this.cancelled.emit();
        if (this.route.snapshot.paramMap.get('id') || this.router.url.includes('/new')) {
            this.router.navigate(['/pharmacy/active-ingredients']);
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
