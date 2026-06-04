import { Component, OnInit, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../../../core/services/customer.service';
import { ModalAlertComponent } from '../../../../shared/components/modal-alert/modal-alert.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';


@Component({
    selector: 'app-customer-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        ModalAlertComponent,
        ConfirmModalComponent,
        SpinnerComponent
    ],
    templateUrl: './customer-form.component.html',
    styleUrl: './customer-form.component.scss'
})
export class CustomerFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private customerService = inject(CustomerService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private modalService = inject(ModalService);

    @Input() isModal: boolean = false;
    @Input() customerId: number | null = null;
    @Output() saveSuccess = new EventEmitter<number>();
    @Output() cancel = new EventEmitter<void>();

    customerForm: FormGroup;
    isEditMode = signal<boolean>(false);
    // Remove local customerId signal if it conflicts, or sync it. 
    // Actually, the component has `customerId = signal<number | null>(null);` property.
    // I should probably use a different name for the Input or update the property to not be a signal if it's just local state, 
    // OR just set the signal value from the input. 
    // Let's rename the internal signal to `currentCustomerId` to avoid conflict, or just use the input. 
    // Wait, the existing code has `customerId = signal<number | null>(null);`.
    // I will rename the *Input* to `id` to match common patterns, OR keep `customerId` and remove the signal.
    // Let's keep the signal for internal consistency and set it from Input.

    // Changing approach: keep `customerId` as Input, remove the signal property `customerId` and use a standard property or just rely on the Input.
    // But `onSubmit` uses `this.customerId()`. 
    // Let's change the internal signal to `activeCustomerId`.

    activeCustomerId = signal<number | null>(null);
    isSearching = signal<boolean>(false);
    isLoading = signal<boolean>(false);
    accumulatedPoints = signal<number>(0);

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

        // Check Input first, then Route
        const routeId = this.route.snapshot.paramMap.get('id');
        const idToLoad = this.customerId || (routeId ? +routeId : null);

        if (idToLoad) {
            this.isEditMode.set(true);
            this.activeCustomerId.set(idToLoad);
            this.loadCustomer(idToLoad);
        } else {
            // Set initial validation for DNI
            this.updateDocumentValidators('DNI');
        }
    }

    setupDocumentTypeListener(): void {
        this.customerForm.get('documentType')?.valueChanges.subscribe(type => {
            if (!this.isLoading()) {
                this.customerForm.patchValue({ documentNumber: '' });
            }
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
            next: (response) => {
                const customer = response.data;
                this.customerForm.patchValue({
                    documentNumber: customer.documentNumber,
                    documentType: customer.documentNumber.length === 11 ? 'RUC' : 'DNI',
                    name: customer.name,
                    phone: customer.phone || '',
                    email: customer.email || '',
                    address: customer.address || ''
                });
                this.accumulatedPoints.set(customer.accumulatedPoints || 0);

                // Update validators based on the loaded document
                this.updateDocumentValidators(customer.documentNumber.length === 11 ? 'RUC' : 'DNI');

                this.isLoading.set(false);
            },
            error: (error) => {
                this.modalService.alert({ title: 'Error', message: 'Error al cargar el cliente. Intenta de nuevo.', type: 'error' });
                this.isLoading.set(false);
                console.error('Error loading customer:', error);
            }
        });
    }

    searchDocument() {
        const document = this.customerForm.get('documentNumber')?.value;
        if (!document) {
            this.modalService.alert({ title: 'Atención', message: 'Ingrese un número de documento para buscar.', type: 'warning' });
            return;
        }

        this.isSearching.set(true);

        this.customerService.searchByDocument(document).subscribe({
            next: (response) => {
                this.isSearching.set(false);
                const data = response.data;

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
                    this.modalService.alert({ title: 'Sin resultados', message: 'No se encontraron datos (nombre/razón social) para este documento.', type: 'warning' });
                }
            },
            error: (error) => {
                this.isSearching.set(false);
                this.modalService.alert({ title: 'Error', message: 'No se encontraron datos para este documento o ocurrió un error.', type: 'error' });
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

        const customerData = this.customerForm.value;

        const request$ = this.isEditMode()
            ? this.customerService.update(this.activeCustomerId()!, customerData)
            : this.customerService.create(customerData);

        request$.subscribe({
            next: (response) => {
                this.isLoading.set(false);
                if (this.isModal) {
                    this.saveSuccess.emit(response.data?.id);
                } else {
                    this.modalService.alert({ title: 'Éxito', message: 'Cliente guardado correctamente', type: 'success' })
                        .then(() => this.router.navigate(['/customers']));
                }
            },
            error: (error) => {
                this.isLoading.set(false);
                let msg = 'Error al guardar el cliente. Verifica los datos e intenta de nuevo.';
                if (error.status === 409) {
                    msg = 'Ya existe un cliente con este número de documento.';
                }
                this.modalService.alert({ title: 'Error', message: msg, type: 'error' });
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
