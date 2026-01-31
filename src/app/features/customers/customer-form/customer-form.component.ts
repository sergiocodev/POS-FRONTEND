import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../../core/services/customer.service';
import { DocumentType } from '../../../core/models/customer.model';

@Component({
    selector: 'app-customer-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './customer-form.component.html',
    styleUrl: './customer-form.component.scss'
})
export class CustomerFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private customerService = inject(CustomerService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    customerForm: FormGroup;
    isEditMode = signal<boolean>(false);
    customerId = signal<number | null>(null);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');
    documentTypes = Object.values(DocumentType);

    constructor() {
        this.customerForm = this.fb.group({
            documentType: [DocumentType.DNI, [Validators.required]],
            documentNumber: ['', [
                Validators.required,
                Validators.maxLength(20),
                Validators.pattern('^[0-9]*$')
            ]],
            name: ['', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(255)
            ]],
            phone: ['', [Validators.maxLength(30)]],
            email: ['', [Validators.email, Validators.maxLength(255)]],
            address: ['']
        });
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.customerId.set(+id);
            this.loadCustomer(+id);
        }
    }

    loadCustomer(id: number): void {
        this.isLoading.set(true);
        this.customerService.getById(id).subscribe({
            next: (customer) => {
                this.customerForm.patchValue({
                    documentType: customer.documentType,
                    documentNumber: customer.documentNumber,
                    name: customer.name,
                    phone: customer.phone || '',
                    email: customer.email || '',
                    address: customer.address || ''
                });
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar el cliente. Intenta de nuevo.');
                this.isLoading.set(false);
                console.error('Error loading customer:', error);
            }
        });
    }

    onSubmit(): void {
        if (this.customerForm.invalid) {
            this.customerForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const customerData = this.customerForm.value;

        const request$ = this.isEditMode()
            ? this.customerService.update(this.customerId()!, customerData)
            : this.customerService.create(customerData);

        request$.subscribe({
            next: () => {
                this.router.navigate(['/customers']);
            },
            error: (error) => {
                this.isLoading.set(false);
                if (error.status === 409) {
                    this.errorMessage.set('Ya existe un cliente con este número de documento.');
                } else {
                    this.errorMessage.set('Error al guardar el cliente. Verifica los datos e intenta de nuevo.');
                }
                console.error('Error saving customer:', error);
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/customers']);
    }

    // Getters for form controls
    get documentType() { return this.customerForm.get('documentType'); }
    get documentNumber() { return this.customerForm.get('documentNumber'); }
    get name() { return this.customerForm.get('name'); }
    get phone() { return this.customerForm.get('phone'); }
    get email() { return this.customerForm.get('email'); }
    get address() { return this.customerForm.get('address'); }
}
