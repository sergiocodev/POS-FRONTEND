import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { EstablishmentRequest } from '../../../../core/models/maintenance.model';

@Component({
    selector: 'app-establishment-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './establishment-form.component.html',
    styleUrl: './establishment-form.component.scss'
})
export class EstablishmentFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private establishmentService = inject(EstablishmentService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    establishmentForm!: FormGroup;
    isEditMode = signal(false);
    establishmentId = signal<number | null>(null);
    isLoading = signal(false);
    isSaving = signal(false);

    ngOnInit() {
        this.initForm();
        this.checkEditMode();
    }

    initForm() {
        this.establishmentForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            address: [''],
            codeSunat: ['0000', [Validators.maxLength(10)]]
        });
    }

    checkEditMode() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.establishmentId.set(+id);
            this.loadEstablishment(+id);
        }
    }

    loadEstablishment(id: number) {
        this.isLoading.set(true);
        this.establishmentService.getById(id).subscribe({
            next: (establishment) => {
                this.establishmentForm.patchValue({
                    name: establishment.name,
                    address: establishment.address,
                    codeSunat: establishment.codeSunat
                });
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading establishment:', error);
                alert('Error al cargar el establecimiento');
                this.router.navigate(['/settings/establishments']);
            }
        });
    }

    onSubmit() {
        if (this.establishmentForm.invalid) {
            this.establishmentForm.markAllAsTouched();
            return;
        }

        this.isSaving.set(true);

        const formValue = this.establishmentForm.value;
        const request: EstablishmentRequest = {
            name: formValue.name,
            address: formValue.address || undefined,
            codeSunat: formValue.codeSunat || '0000',
            active: true // Always set to active when creating/updating
        };

        const operation = this.isEditMode()
            ? this.establishmentService.update(this.establishmentId()!, request)
            : this.establishmentService.create(request);

        operation.subscribe({
            next: () => {
                this.isSaving.set(false);
                alert(`Establecimiento ${this.isEditMode() ? 'actualizado' : 'creado'} exitosamente`);
                this.router.navigate(['/settings/establishments']);
            },
            error: (error) => {
                console.error('Error saving establishment:', error);
                this.isSaving.set(false);
                alert('Error al guardar el establecimiento');
            }
        });
    }

    cancel() {
        this.router.navigate(['/settings/establishments']);
    }

    get f() {
        return this.establishmentForm.controls;
    }
}
