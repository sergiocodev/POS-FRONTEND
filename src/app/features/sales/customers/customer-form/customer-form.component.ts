import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../../../core/services/customer.service';


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

    @Input() isModal: boolean = false;
    @Output() saveSuccess = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    customerForm: FormGroup;
    isEditMode = signal<boolean>(false);
    customerId = signal<number | null>(null);
    isSearching = signal<boolean>(false);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');

    documentTypes = [
        { value: 'DNI', label: 'DNI' },
        { value: 'RUC', label: 'RUC' }
    ];

    constructor() {
        this.customerForm = this.fb.group({
            documentType: ['DNI', Validators.required],
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
        this.setupDocumentTypeListener();

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.customerId.set(+id);
            this.loadCustomer(+id);
        } else {
            // Set initial validation for DNI
            this.updateDocumentValidators('DNI');
        }
    }

    setupDocumentTypeListener(): void {
        this.customerForm.get('documentType')?.valueChanges.subscribe(type => {
            this.customerForm.patchValue({ documentNumber: '' });
            this.updateDocumentValidators(type);
        });
    }

    updateDocumentValidators(type: string): void {
        const documentControl = this.customerForm.get('documentNumber');
        if (type === 'DNI') {
            documentControl?.setValidators([
                Validators.required,
                Validators.pattern('^[0-9]{8}$')
            ]);
        } else if (type === 'RUC') {
            documentControl?.setValidators([
                Validators.required,
                Validators.pattern('^[0-9]{11}$')
            ]);
        }
        documentControl?.updateValueAndValidity();
    }

    loadCustomer(id: number): void {
        this.isLoading.set(true);
        this.customerService.getById(id).subscribe({
            next: (customer) => {
                this.customerForm.patchValue({
                    documentNumber: customer.documentNumber,
                    documentType: customer.documentNumber.length === 11 ? 'RUC' : 'DNI',
                    name: customer.name,
                    phone: customer.phone || '',
                    email: customer.email || '',
                    address: customer.address || ''
                });
                // Update validators based on the loaded document
                this.updateDocumentValidators(customer.documentNumber.length === 11 ? 'RUC' : 'DNI');

                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar el cliente. Intenta de nuevo.');
                this.isLoading.set(false);
                console.error('Error loading customer:', error);
            }
        });
    }

    searchDocument() {
        const document = this.customerForm.get('documentNumber')?.value;
        if (!document) {
            this.errorMessage.set('Ingrese un número de documento para buscar.');
            return;
        }

        this.isSearching.set(true);
        this.errorMessage.set('');

        this.customerService.searchByDocument(document).subscribe({
            next: (data) => {
                this.isSearching.set(false);

                let fullName = '';
                if (data.razonSocial) {
                    fullName = data.razonSocial;
                } else if (data.nombres) {
                    fullName = `${data.nombres} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim();
                }

                let fullAddress = data.direccion || '';
                const ubigeo = [data.departamento, data.provincia, data.distrito].filter(Boolean).join(' - ');
                if (ubigeo) {
                    fullAddress = fullAddress ? `${fullAddress}, ${ubigeo}` : ubigeo;
                }

                if (fullName) {
                    this.customerForm.patchValue({
                        name: fullName,
                        address: fullAddress
                    });
                } else {
                    this.errorMessage.set('No se encontraron datos (nombre/razón social) para este documento.');
                }
            },
            error: (error) => {
                this.isSearching.set(false);
                this.errorMessage.set('No se encontraron datos para este documento o ocurrió un error.');
                console.error('Search error:', error);
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
                if (this.isModal) {
                    this.saveSuccess.emit();
                } else {
                    this.router.navigate(['/customers']);
                }
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
        if (this.isModal) {
            this.cancel.emit();
        } else {
            this.router.navigate(['/customers']);
        }
    }



    get documentNumber() { return this.customerForm.get('documentNumber'); }
    get name() { return this.customerForm.get('name'); }
    get phone() { return this.customerForm.get('phone'); }
    get email() { return this.customerForm.get('email'); }
    get address() { return this.customerForm.get('address'); }
}
