import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupplierService } from '../../../../core/services/supplier.service';

@Component({
    selector: 'app-supplier-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './supplier-form.component.html',
    styleUrl: './supplier-form.component.scss'
})
export class SupplierFormComponent implements OnInit, OnChanges {
    @Input() supplierId: number | null = null;
    @Output() cancel = new EventEmitter<void>();
    @Output() saved = new EventEmitter<void>();

    private fb = inject(FormBuilder);
    private supplierService = inject(SupplierService);

    supplierForm: FormGroup;
    isEditMode = signal<boolean>(false);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');
    isSearching = signal<boolean>(false);

    documentTypes = [
        { value: 'RUC', label: 'RUC' },
        { value: 'DNI', label: 'DNI' }
    ];

    constructor() {
        this.supplierForm = this.fb.group({
            documentType: ['RUC', Validators.required],
            documentNumber: ['', [
                Validators.required,
                Validators.maxLength(20),
                Validators.pattern('^[0-9]*$')
            ]],
            name: ['', [Validators.required, Validators.maxLength(255)]],
            phone: ['', [Validators.maxLength(30)]],
            email: ['', [Validators.email, Validators.maxLength(255)]],
            address: ['', [Validators.maxLength(255)]]
        });
    }

    ngOnInit(): void {
        this.setupDocumentTypeListener();
        this.updateDocumentValidators('RUC');
    }

    setupDocumentTypeListener(): void {
        this.supplierForm.get('documentType')?.valueChanges.subscribe(type => {
            if (!this.isLoading()) {
                this.supplierForm.patchValue({ documentNumber: '' });
            }
            this.updateDocumentValidators(type);
        });
    }

    updateDocumentValidators(type: string): void {
        const documentControl = this.supplierForm.get('documentNumber');
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

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['supplierId']) {
            const id = this.supplierId;
            if (id) {
                this.isEditMode.set(true);
                this.loadSupplier(id);
            } else {
                this.isEditMode.set(false);
                this.supplierForm.reset({ documentType: 'RUC' });
            }
        }
    }

    loadSupplier(id: number): void {
        this.isLoading.set(true);
        this.supplierService.getById(id).subscribe({
            next: (response: any) => {
                const supplier = response.data;
                this.supplierForm.patchValue({
                    documentType: supplier.ruc?.length === 8 ? 'DNI' : 'RUC',
                    documentNumber: supplier.ruc || '',
                    name: supplier.name,
                    phone: supplier.phone || '',
                    email: supplier.email || '',
                    address: supplier.address || ''
                });
                this.updateDocumentValidators(supplier.ruc?.length === 8 ? 'DNI' : 'RUC');
                this.isLoading.set(false);
            },
            error: (error: any) => {
                this.errorMessage.set('Error al cargar el proveedor. Intenta de nuevo.');
                this.isLoading.set(false);
                console.error('Error loading supplier:', error);
            }
        });
    }

    searchDocument() {
        const document = this.supplierForm.get('documentNumber')?.value;
        if (!document) {
            this.errorMessage.set('Ingrese un número de documento para buscar.');
            return;
        }

        this.isSearching.set(true);
        this.errorMessage.set('');

        this.supplierService.searchByDocument(document).subscribe({
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
                    this.supplierForm.patchValue({
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
        if (this.supplierForm.invalid) {
            this.supplierForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const formValue = this.supplierForm.value;
        const supplierData = {
            name: formValue.name,
            ruc: formValue.documentNumber,
            phone: formValue.phone,
            email: formValue.email,
            address: formValue.address
        };

        const request$ = this.isEditMode() && this.supplierId
            ? this.supplierService.update(this.supplierId, supplierData)
            : this.supplierService.create(supplierData);

        request$.subscribe({
            next: () => {
                this.isLoading.set(false);
                this.saved.emit();
            },
            error: (error: any) => {
                this.isLoading.set(false);
                this.errorMessage.set('Error al guardar el proveedor. Verifica los datos e intenta de nuevo.');
                console.error('Error saving supplier:', error);
            }
        });
    }

    onCancel(): void {
        this.cancel.emit();
    }

    get documentType() { return this.supplierForm.get('documentType'); }
    get documentNumber() { return this.supplierForm.get('documentNumber'); }
    get name() { return this.supplierForm.get('name'); }
    get phone() { return this.supplierForm.get('phone'); }
    get email() { return this.supplierForm.get('email'); }
    get address() { return this.supplierForm.get('address'); }
}
