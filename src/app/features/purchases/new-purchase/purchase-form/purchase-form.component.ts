import { Component, OnInit, inject, input, output, effect, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PurchaseRequest, PurchaseResponse, PurchaseDocumentType, PaymentCondition, PaymentMethod } from '../../../../core/models/purchase.model';
import { ProductResponse, ProductUnitResponse } from '../../../../core/models/product.model';
import { SupplierResponse } from '../../../../core/models/supplier.model';
import { EstablishmentResponse } from '../../../../core/models/sale.model';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

export interface PurchaseItemForm {
    productId: FormControl<number | null>;
    productUnitId: FormControl<number | null>;
    lotCode: FormControl<string | null>;
    expiryDate: FormControl<string | null>;
    quantity: FormControl<number | null>;
    bonusQuantity: FormControl<number | null>;
    unitCost: FormControl<number | null>;
}

export interface PurchaseForm {
    supplierId: FormControl<number | null>;
    establishmentId: FormControl<number | null>;
    documentType: FormControl<PurchaseDocumentType | null>;
    series: FormControl<string | null>;
    number: FormControl<string | null>;
    issueDate: FormControl<string | null>;
    paymentCondition: FormControl<PaymentCondition | null>;
    initialPayment: FormControl<number | null>;
    paymentMethod: FormControl<PaymentMethod | null>;
    dueDate: FormControl<string | null>;
    notes: FormControl<string | null>;
    items: FormArray<FormGroup<PurchaseItemForm>>;
}

@Component({
    selector: 'app-purchase-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ModuleHeaderComponent],
    templateUrl: './purchase-form.component.html',
    styleUrl: './purchase-form.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private destroyRef = inject(DestroyRef);

    isLoading = input<boolean>(false);
    isEditMode = input<boolean>(false);
    errorMessage = input<string>('');

    products = input<ProductResponse[]>([]);
    suppliers = input<SupplierResponse[]>([]);
    establishments = input<EstablishmentResponse[]>([]);
    productUnits = input<{ [productId: number]: ProductUnitResponse[] }>({});

    purchase = input<PurchaseResponse | undefined>(undefined);

    loadProductUnits = output<number>();
    savePurchase = output<PurchaseRequest>();

    purchaseForm: FormGroup<PurchaseForm>;

    paymentConditions = Object.values(PaymentCondition);
    paymentMethods = Object.values(PaymentMethod);
    PaymentConditionEnum = PaymentCondition;

    constructor() {
        this.purchaseForm = this.fb.group<PurchaseForm>({
            supplierId: this.fb.control<number | null>(null, Validators.required),
            establishmentId: this.fb.control<number | null>(null, Validators.required),
            documentType: this.fb.control<PurchaseDocumentType | null>(PurchaseDocumentType.FACTURA, Validators.required),
            series: this.fb.control<string | null>('', [Validators.required, Validators.maxLength(20)]),
            number: this.fb.control<string | null>('', [Validators.required, Validators.maxLength(20)]),
            issueDate: this.fb.control<string | null>(new Date().toISOString().split('T')[0], Validators.required),
            paymentCondition: this.fb.control<PaymentCondition | null>(PaymentCondition.CASH, Validators.required),
            initialPayment: this.fb.control<number | null>({ value: 0, disabled: true }, [Validators.min(0)]),
            paymentMethod: this.fb.control<PaymentMethod | null>(PaymentMethod.EFECTIVO),
            dueDate: this.fb.control<string | null>(null),
            notes: this.fb.control<string | null>(''),
            items: this.fb.array<FormGroup<PurchaseItemForm>>([])
        });

        effect(() => {
            const currentPurchase = this.purchase();
            if (currentPurchase) {
                this.applyPurchase(currentPurchase);
            }
        });
    }

    get items(): FormArray<FormGroup<PurchaseItemForm>> {
        return this.purchaseForm.controls.items;
    }

    ngOnInit(): void {
        this.setupPaymentListeners();
        // Since effect will handle applyPurchase if purchase is provided,
        // we should only add a blank item if not in edit mode
        setTimeout(() => {
            if (!this.isEditMode() && this.items.length === 0) {
                this.addItem();
            }
        });
    }

    setupPaymentListeners(): void {
        const conditionCtrl = this.purchaseForm.get('paymentCondition');
        const initialPaymentCtrl = this.purchaseForm.get('initialPayment');
        const paymentMethodCtrl = this.purchaseForm.get('paymentMethod');
        const dueDateCtrl = this.purchaseForm.get('dueDate');

        conditionCtrl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(condition => {
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

        initialPaymentCtrl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
            if (conditionCtrl?.value === PaymentCondition.CREDIT) {
                if (val && val > 0) {
                    paymentMethodCtrl?.setValidators([Validators.required]);
                } else {
                    paymentMethodCtrl?.clearValidators();
                }
                paymentMethodCtrl?.updateValueAndValidity();
            }
        });

        this.purchaseForm.get('items')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            if (conditionCtrl?.value === PaymentCondition.CASH) {
                initialPaymentCtrl?.setValue(this.calculateTotal(), { emitEvent: false });
            }
        });
    }

    private applyPurchase(purchase: PurchaseResponse): void {
        this.purchaseForm.patchValue({
            supplierId: this.suppliers().find(s => s.name === purchase.supplierName)?.id ?? null,
            establishmentId: this.establishments().find(e => e.name === purchase.establishmentName)?.id ?? null,
            documentType: purchase.documentType as PurchaseDocumentType,
            series: purchase.series,
            number: purchase.number,
            issueDate: purchase.issueDate,
            paymentCondition: purchase.paymentCondition as PaymentCondition,
            initialPayment: 0,
            paymentMethod: null,
            notes: purchase.notes ?? null
        });

        this.items.clear();

        purchase.items.forEach(item => {
            const product = this.products().find(p => p.tradeName === item.productName);
            this.items.push(this.fb.group<PurchaseItemForm>({
                productId:     this.fb.control<number | null>(product?.id ?? null, Validators.required),
                productUnitId: this.fb.control<number | null>(item.productUnitId,  Validators.required),
                lotCode:       this.fb.control<string | null>(item.lotCode,         Validators.required),
                expiryDate:    this.fb.control<string | null>(item.expiryDate,      Validators.required),
                quantity:      this.fb.control<number | null>(item.quantity,        [Validators.required, Validators.min(1)]),
                bonusQuantity: this.fb.control<number | null>(item.bonusQuantity ?? null),
                unitCost:      this.fb.control<number | null>(item.unitCost,        [Validators.required, Validators.min(0)])
            }));
        });

        this.purchaseForm.disable();
    }

    addItem(): void {
        const itemForm = this.fb.group<PurchaseItemForm>({
            productId: this.fb.control<number | null>(null, Validators.required),
            productUnitId: this.fb.control<number | null>({ value: null, disabled: true }, Validators.required),
            lotCode: this.fb.control<string | null>('', [Validators.required, Validators.maxLength(100)]),
            expiryDate: this.fb.control<string | null>('', Validators.required),
            quantity: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
            bonusQuantity: this.fb.control<number | null>(0),
            unitCost: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)])
        });

        itemForm.controls.productId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(productId => {
            if (productId) {
                this.loadProductUnits.emit(productId);
                itemForm.controls.productUnitId.enable();
            } else {
                itemForm.controls.productUnitId.disable();
            }
        });

        this.items.push(itemForm);
    }

    removeItem(index: number): void {
        if (this.items.length > 1) {
            this.items.removeAt(index);
        }
    }

    calculateTotal(): number {
        return this.items.controls.reduce((sum, ctrl) => {
            const qty = ctrl.controls.quantity.value || 0;
            const cost = ctrl.controls.unitCost.value || 0;
            return sum + (qty * cost);
        }, 0);
    }

    onSubmit(): void {
        if (this.purchaseForm.invalid) {
            this.purchaseForm.markAllAsTouched();
            return;
        }

        const formValue = this.purchaseForm.getRawValue();

        const request: PurchaseRequest = {
            ...formValue,
            supplierId:      +(formValue.supplierId || 0),
            establishmentId: +(formValue.establishmentId || 0),
            documentType:    formValue.documentType as PurchaseDocumentType,
            series:          formValue.series || '',
            number:          formValue.number || '',
            issueDate:       formValue.issueDate || '',
            paymentCondition: formValue.paymentCondition as PaymentCondition,
            initialPayment:  formValue.initialPayment || 0,
            paymentMethod:   formValue.paymentMethod ?? undefined,
            dueDate:         formValue.dueDate ?? undefined,
            notes:           formValue.notes ?? undefined,
            items: formValue.items.map(item => ({
                ...item,
                productId:     +(item.productId || 0),
                productUnitId: +(item.productUnitId || 0),
                lotCode:       item.lotCode || '',
                expiryDate:    item.expiryDate || '',
                quantity:      +(item.quantity || 0),
                bonusQuantity: item.bonusQuantity ? +item.bonusQuantity : 0,
                unitCost:      +(item.unitCost || 0)
            }))
        };

        this.savePurchase.emit(request);
    }
}
