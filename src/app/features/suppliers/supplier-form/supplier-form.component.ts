import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupplierService } from '../../../core/services/supplier.service';

@Component({
    selector: 'app-supplier-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './supplier-form.component.html',
    styleUrl: './supplier-form.component.scss'
})
export class SupplierFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private supplierService = inject(SupplierService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    supplierForm: FormGroup;
    isEditMode = signal<boolean>(false);
    supplierId = signal<number | null>(null);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');

    constructor() {
        this.supplierForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(255)]],
            ruc: ['', [Validators.maxLength(20)]],
            phone: ['', [Validators.maxLength(30)]],
            email: ['', [Validators.email, Validators.maxLength(255)]],
            address: ['', [Validators.maxLength(255)]],
            active: [true]
        });
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.supplierId.set(+id);
            this.loadSupplier(+id);
        }
    }

    loadSupplier(id: number): void {
        this.isLoading.set(true);
        this.supplierService.getById(id).subscribe({
            next: (response) => {
                const supplier = response.data;
                this.supplierForm.patchValue({
                    name: supplier.name,
                    ruc: supplier.ruc || '',
                    phone: supplier.phone || '',
                    email: supplier.email || '',
                    address: supplier.address || '',
                    active: supplier.active
                });
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar el proveedor. Intenta de nuevo.');
                this.isLoading.set(false);
                console.error('Error loading supplier:', error);
            }
        });
    }

    onSubmit(): void {
        if (this.supplierForm.invalid) {
            this.supplierForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const supplierData = this.supplierForm.value;

        const request$ = this.isEditMode()
            ? this.supplierService.update(this.supplierId()!, supplierData)
            : this.supplierService.create(supplierData);

        request$.subscribe({
            next: () => {
                this.router.navigate(['/suppliers']);
            },
            error: (error) => {
                this.isLoading.set(false);
                this.errorMessage.set('Error al guardar el proveedor. Verifica los datos e intenta de nuevo.');
                console.error('Error saving supplier:', error);
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/suppliers']);
    }


    get name() { return this.supplierForm.get('name'); }
    get ruc() { return this.supplierForm.get('ruc'); }
    get phone() { return this.supplierForm.get('phone'); }
    get email() { return this.supplierForm.get('email'); }
    get address() { return this.supplierForm.get('address'); }
    get active() { return this.supplierForm.get('active'); }
}
