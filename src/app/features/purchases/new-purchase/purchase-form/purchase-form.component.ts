import { Component, OnInit, inject, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PurchaseRequest, PurchaseResponse, PurchaseDocumentType, PaymentCondition, PaymentMethod } from '../../../../core/models/purchase.model';
import { ProductResponse, ProductUnitResponse } from '../../../../core/models/product.model';
import { SupplierResponse } from '../../../../core/models/supplier.model';
import { EstablishmentResponse } from '../../../../core/models/sale.model';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-purchase-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ModuleHeaderComponent],
    templateUrl: './purchase-form.component.html',
    styleUrl: './purchase-form.component.scss'
})
export class PurchaseFormComponent implements OnInit {
    private fb = inject(FormBuilder);

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

    purchaseForm: FormGroup;

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

        effect(() => {
            const currentPurchase = this.purchase();
            if (currentPurchase) {
                this.applyPurchase(currentPurchase);
            }
        });
    }

    get items(): FormArray {
        return this.purchaseForm.get('items') as FormArray;
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

    private applyPurchase(purchase: PurchaseResponse): void {
        this.purchaseForm.patchValue({
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
                this.loadProductUnits.emit(productId);
                itemForm.get('productUnitId')?.enable();
            } else {
                itemForm.get('productUnitId')?.disable();
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

        const formValue = this.purchaseForm.getRawValue();

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

        this.savePurchase.emit(request);
    }
}
