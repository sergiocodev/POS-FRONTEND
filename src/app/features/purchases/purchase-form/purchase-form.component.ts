import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { SaleService } from '../../../core/services/sale.service';
import { PurchaseRequest, PurchaseResponse, PurchaseDocumentType, PurchaseStatus, PaymentCondition, PaymentMethod } from '../../../core/models/purchase.model';
import { ProductResponse, ProductUnitResponse } from '../../../core/models/product.model';
import { SupplierResponse } from '../../../core/models/supplier.model';
import { EstablishmentResponse } from '../../../core/models/sale.model';
import { AuthService } from '../../../core/services/auth.service';
import { ProductUnitService } from '../../../core/services/product-unit.service';
import { forkJoin, switchMap, of } from 'rxjs';
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
        this.setupPaymentListeners();
        const id = this.route.snapshot.params['id'];
        // FIX #2: Evitar race condition — cargar datos maestros primero,
        // y solo entonces cargar la compra existente (si hay id)
        this.loadInitialData(id ? +id : null);
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

    loadInitialData(purchaseId: number | null = null): void {
        this.isLoading.set(true);
        forkJoin({
            products: this.productService.getAll(),
            suppliers: this.supplierService.getAll(),
            establishments: this.saleService.getEstablishments()
        }).pipe(
            // FIX #2: Si hay purchaseId, lo cargamos DESPUÉS de que los datos maestros estén listos
            switchMap(data => {
                this.products.set(data.products.data);
                this.suppliers.set(data.suppliers.data);
                this.establishments.set(data.establishments.data);

                if (purchaseId) {
                    return this.purchaseService.getById(purchaseId);
                }
                return of(null);
            })
        ).subscribe({
            next: (purchaseResponse) => {
                if (purchaseResponse) {
                    this.isEditMode.set(true);
                    this.applyPurchase(purchaseResponse.data);
                } else {
                    this.addItem();
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set('Error al cargar datos. Intente nuevamente.');
                this.isLoading.set(false);
            }
        });
    }

    purchase = signal<PurchaseResponse | undefined>(undefined);

    // FIX #2 & #3: Este método se llama solo cuando los datos maestros ya están cargados
    private applyPurchase(purchase: PurchaseResponse): void {
        this.purchase.set(purchase);
        this.purchaseForm.patchValue({
            // Buscar por nombre porque el response solo trae strings, no IDs
            supplierId: this.suppliers().find(s => s.name === purchase.supplierName)?.id,
            establishmentId: this.establishments().find(e => e.name === purchase.establishmentName)?.id,
            documentType: purchase.documentType,
            series: purchase.series,
            number: purchase.number,
            issueDate: purchase.issueDate,
            paymentCondition: purchase.paymentCondition,
            initialPayment: 0,
            paymentMethod: null,
            notes: purchase.notes
        });

        this.items.clear();

        // FIX #3: Precargar las unidades de cada producto para que el dropdown
        // muestre correctamente la unidad seleccionada en modo vista
        const uniqueProductIds = [...new Set(
            purchase.items
                .map(item => this.products().find(p => p.tradeName === item.productName)?.id)
                .filter((id): id is number => id !== undefined)
        )];

        const unitLoaders = uniqueProductIds.length > 0
            ? forkJoin(Object.fromEntries(
                uniqueProductIds.map(pid => [pid, this.productUnitService.getByProductId(pid)])
              ))
            : of({} as Record<number, ProductUnitResponse[]>);

        unitLoaders.subscribe(unitsMap => {
            this.productUnits.update(curr => ({ ...curr, ...unitsMap }));

            purchase.items.forEach(item => {
                const product = this.products().find(p => p.tradeName === item.productName);
                this.items.push(this.fb.group({
                    productId:     [product?.id ?? null, Validators.required],
                    productUnitId: [item.productUnitId,  Validators.required],
                    lotCode:       [item.lotCode,         Validators.required],
                    expiryDate:    [item.expiryDate,      Validators.required],
                    quantity:      [item.quantity,        [Validators.required, Validators.min(1)]],
                    bonusQuantity: [item.bonusQuantity],
                    unitCost:      [item.unitCost,        [Validators.required, Validators.min(0)]]
                }));
            });

            this.purchaseForm.disable();
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

        const formValue = this.purchaseForm.getRawValue();

        // FIX #1 & #4: Convertir IDs explícitamente a number para que el payload
        // enviado al backend sea consistente (evita strings por [value] del HTML)
        const request: PurchaseRequest = {
            ...formValue,
            supplierId:      +formValue.supplierId,
            establishmentId: +formValue.establishmentId,
            initialPayment:  formValue.initialPayment || 0,
            items: formValue.items.map((item: any) => ({
                ...item,
                productId:     +item.productId,
                productUnitId: +item.productUnitId,
                quantity:      +item.quantity,
                bonusQuantity: item.bonusQuantity ? +item.bonusQuantity : 0,
                unitCost:      +item.unitCost
            }))
        };

        const userId = this.authService.currentUser()?.id || 1;

        this.purchaseService.create(request, userId).subscribe({
            next: () => {
                this.router.navigate(['/purchases']);
            },
            error: () => {
                this.errorMessage.set('Error al registrar la compra. Verifique los datos.');
                this.isLoading.set(false);
            }
        });
    }
}
