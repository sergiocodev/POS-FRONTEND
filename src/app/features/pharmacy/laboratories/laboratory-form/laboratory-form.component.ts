import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { LaboratoryRequest } from '../../../../core/models/laboratory.model';

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
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    @Input() set idLaboratory(value: number | null) {
        this._laboratoryId.set(value);
        this.checkEditModeFromInput();
    }
    get idLaboratory(): number | null {
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
        this.checkEditModeFromRoute();
    }

    initForm() {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(200)]],
            active: [true]
        });
    }

    checkEditModeFromRoute() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this._laboratoryId.set(+id);
            this.loadLaboratory(+id);
        }
    }

    checkEditModeFromInput() {
        const id = this.idLaboratory;
        if (id) {
            this.isEditMode.set(true);
            this.loadLaboratory(id);
        } else {
            this.isEditMode.set(false);
            if (this.form) {
                this.form.reset({ active: true });
            }
        }
    }

    loadLaboratory(id: number) {
        this.isLoading.set(true);
        this.maintenanceService.getLaboratories().subscribe({
            next: (response) => {
                const laboratory = response.data.find(l => l.id === id);
                if (laboratory) {
                    this.form.patchValue({
                        name: laboratory.name,
                        active: laboratory.active
                    });
                } else {
                    alert('Laboratorio no encontrado');
                    this.router.navigate(['/pharmacy/labs']);
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading laboratory:', error);
                alert('Error al cargar el laboratorio');
                this.router.navigate(['/pharmacy/labs']);
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
            ? this.maintenanceService.updateLaboratory(
                this._laboratoryId()!,
                request.name,
                request.active
            )
            : this.maintenanceService.createLaboratory(
                request.name,
                request.active
            );

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.saved.emit();
                // Si aún estamos en modo ruta (no modal), navegar
                if (this.route.snapshot.paramMap.get('id') || this.router.url.includes('/new')) {
                    this.router.navigate(['/pharmacy/labs']);
                }
            },
            error: (error) => {
                console.error('Error saving laboratory:', error);
                alert('Error al guardar el laboratorio');
                this.isSaving.set(false);
            }
        });
    }

    onCancel() {
        this.cancelled.emit();
        if (this.route.snapshot.paramMap.get('id') || this.router.url.includes('/new')) {
            this.router.navigate(['/pharmacy/labs']);
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
