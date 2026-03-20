import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { SaleService } from '../../../core/services/sale.service';
import { PurchaseRequest, PurchaseDocumentType, PurchaseStatus, PaymentCondition, PaymentMethod } from '../../../core/models/purchase.model';
import { ProductResponse, ProductUnitResponse } from '../../../core/models/product.model';
import { SupplierResponse } from '../../../core/models/supplier.model';
import { EstablishmentResponse } from '../../../core/models/sale.model';
import { AuthService } from '../../../core/services/auth.service';
import { ProductUnitService } from '../../../core/services/product-unit.service';
import { forkJoin } from 'rxjs';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-purchase-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ModuleHeaderComponent],
    templateUrl: './purchase-form.component.html',
    styleUrl: './purchase-form.component.scss'
})
export class PurchaseFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private purchaseService = inject(PurchaseService);
    private productService = inject(ProductService);
    private supplierService = inject(SupplierService);
    private saleService = inject(SaleService);
    private authService = inject(AuthService);
    private productUnitService = inject(ProductUnitService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    purchaseForm: FormGroup;
    isLoading = signal<boolean>(false);
    isEditMode = signal<boolean>(false);
    errorMessage = signal<string>('');

    products = signal<ProductResponse[]>([]);
    suppliers = signal<SupplierResponse[]>([]);
    establishments = signal<EstablishmentResponse[]>([]);
    productUnits = signal<{ [productId: number]: ProductUnitResponse[] }>({});

    paymentConditions = Object.values(PaymentCondition);
    paymentMethods = Object.values(PaymentMethod);

    PaymentConditionEnum = PaymentCondition;

    constructor() {
        this.purchaseForm = this.fb.group({
            supplierId: [null, Validators.required],
            establishmentId: [null, Validators.required],
            documentType: [PurchaseDocumentType.FACTURA, Validators.required],
            series: ['', [Validators.required, Validators.maxLength(20)]],
            number: ['', [Validators.required, Validators.maxLength(20)]],
            issueDate: [new Date().toISOString().split('T')[0], Validators.required],
            paymentCondition: [PaymentCondition.CASH, Validators.required],
            initialPayment: [{ value: 0, disabled: true }, [Validators.min(0)]],
            paymentMethod: [PaymentMethod.EFECTIVO],
            dueDate: [null],
            notes: [''],
            items: this.fb.array([])
        });
    }

    get items(): FormArray {
        return this.purchaseForm.get('items') as FormArray;
    }

    ngOnInit(): void {
        this.loadInitialData();
        this.setupPaymentListeners();

        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isEditMode.set(true);
            this.loadPurchase(id);
        } else {
            this.addItem();
        }
    }

    setupPaymentListeners(): void {
        const conditionCtrl = this.purchaseForm.get('paymentCondition');
        const initialPaymentCtrl = this.purchaseForm.get('initialPayment');
        const paymentMethodCtrl = this.purchaseForm.get('paymentMethod');
        const dueDateCtrl = this.purchaseForm.get('dueDate');

        conditionCtrl?.valueChanges.subscribe(condition => {
            if (condition === PaymentCondition.CASH) {
                initialPaymentCtrl?.disable();
                initialPaymentCtrl?.setValue(this.calculateTotal(), { emitEvent: false });
                paymentMethodCtrl?.setValidators([Validators.required]);
                dueDateCtrl?.clearValidators();
                dueDateCtrl?.setValue(null, { emitEvent: false });
            } else {
                initialPaymentCtrl?.enable();
                initialPaymentCtrl?.setValue(0, { emitEvent: false });
                paymentMethodCtrl?.clearValidators();
                dueDateCtrl?.setValidators([Validators.required]);
            }
            paymentMethodCtrl?.updateValueAndValidity();
            dueDateCtrl?.updateValueAndValidity();
        });

        initialPaymentCtrl?.valueChanges.subscribe(val => {
            if (conditionCtrl?.value === PaymentCondition.CREDIT) {
                if (val && val > 0) {
                    paymentMethodCtrl?.setValidators([Validators.required]);
                } else {
                    paymentMethodCtrl?.clearValidators();
                }
                paymentMethodCtrl?.updateValueAndValidity();
            }
        });

        this.purchaseForm.get('items')?.valueChanges.subscribe(() => {
            if (conditionCtrl?.value === PaymentCondition.CASH) {
                initialPaymentCtrl?.setValue(this.calculateTotal(), { emitEvent: false });
            }
        });
    }

    loadInitialData(): void {
        this.isLoading.set(true);
        forkJoin({
            products: this.productService.getAll(),
            suppliers: this.supplierService.getAll(),
            establishments: this.saleService.getEstablishments()
        }).subscribe({
            next: (data) => {
                const products = data.products.data;
                const suppliers = data.suppliers.data;
                // saleService is now refactored
                const establishments = data.establishments.data;

                this.products.set(products);
                this.suppliers.set(suppliers);
                this.establishments.set(establishments);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.errorMessage.set('Error al cargar datos auxiliares.');
                this.isLoading.set(false);
            }
        });
    }

    loadPurchase(id: number): void {
        this.isLoading.set(true);
        this.purchaseService.getById(id).subscribe({
            next: (response) => {
                const purchase = response.data;
                this.purchaseForm.patchValue({
                    supplierId: this.suppliers().find(s => s.name === purchase.supplierName)?.id,
                    establishmentId: this.establishments().find(e => e.name === purchase.establishmentName)?.id,
                    documentType: purchase.documentType,
                    series: purchase.series,
                    number: purchase.number,
                    issueDate: purchase.issueDate,
                    paymentCondition: PaymentCondition.CASH, // Edit mode defaults or we would need it from backend
                    initialPayment: 0,
                    paymentMethod: null,
                    notes: purchase.notes
                });


                this.items.clear();
                purchase.items.forEach(item => {
                    const product = this.products().find(p => p.tradeName === item.productName);
                    this.items.push(this.fb.group({
                        productId: [product?.id, Validators.required],
                        productUnitId: [item.productUnitId, Validators.required],
                        lotCode: [item.lotCode, Validators.required],
                        expiryDate: [item.expiryDate, Validators.required],
                        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
                        bonusQuantity: [item.bonusQuantity],
                        unitCost: [item.unitCost, [Validators.required, Validators.min(0)]]
                    }));
                });

                this.purchaseForm.disable();
                this.isLoading.set(false);
            },
            error: (err) => {
                this.errorMessage.set('Error al cargar la compra.');
                this.isLoading.set(false);
            }
        });
    }

    addItem(): void {
        const itemForm = this.fb.group({
            productId: [null, Validators.required],
            productUnitId: [{ value: null, disabled: true }, Validators.required],
            lotCode: ['', [Validators.required, Validators.maxLength(100)]],
            expiryDate: ['', Validators.required],
            quantity: [null, [Validators.required, Validators.min(1)]],
            bonusQuantity: [0],
            unitCost: [null, [Validators.required, Validators.min(0)]]
        });

        itemForm.get('productId')?.valueChanges.subscribe(productId => {
            if (productId) {
                this.loadProductUnits(productId);
                itemForm.get('productUnitId')?.enable();
            } else {
                itemForm.get('productUnitId')?.disable();
            }
        });

        this.items.push(itemForm);
    }

    loadProductUnits(productId: number): void {
        if (this.productUnits()[productId]) return;
        
        this.productUnitService.getByProductId(productId).subscribe({
            next: (units) => {
                this.productUnits.update(curr => ({...curr, [productId]: units}));
            }
        });
    }

    removeItem(index: number): void {
        if (this.items.length > 1) {
            this.items.removeAt(index);
        }
    }

    calculateTotal(): number {
        return this.items.controls.reduce((sum, ctrl) => {
            const qty = ctrl.get('quantity')?.value || 0;
            const cost = ctrl.get('unitCost')?.value || 0;
            return sum + (qty * cost);
        }, 0);
    }

    onSubmit(): void {
        if (this.purchaseForm.invalid) {
            this.purchaseForm.markAllAsTouched();
            return;
        }

        this.errorMessage.set('');

        this.isLoading.set(true);
        const formValue = this.purchaseForm.getRawValue(); // To include disabled initialPayment
        const request: PurchaseRequest = {
            ...formValue,
            initialPayment: formValue.initialPayment || 0
        };
        const userId = this.authService.currentUser()?.id || 1;

        this.purchaseService.create(request, userId).subscribe({
            next: () => {
                this.router.navigate(['/purchases']);
            },
            error: (err) => {
                this.errorMessage.set('Error al registrar la compra. Verifique los datos.');
                this.isLoading.set(false);
            }
        });
    }
}
