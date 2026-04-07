import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, signal, computed, effect, untracked } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { QuantityInputComponent } from '../quantity-input/quantity-input.component';
import { PaymentMethod, PaymentCondition } from '../../../core/models/sale.model';

@Component({
  selector: 'app-checkout-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, QuantityInputComponent],
  templateUrl: './checkout-panel.component.html',
  styleUrl: './checkout-panel.component.scss',
})
export class CheckoutPanelComponent {
  @Input() cart = signal<any[]>([]);
  @Input() customers = signal<any[]>([]);
  @Input() isLoading = signal<boolean>(false);

  @Output() onProcessSale = new EventEmitter<any>();
  @Output() onClearCart = new EventEmitter<void>();
  @Output() onAddCustomer = new EventEmitter<void>();

  posForm: FormGroup;
  selectedCustomer = signal<any>(null);

  // Cálculos Computados (Performance Pro)
  subtotal = computed(() =>
    this.cart().reduce((acc, item) => acc + (item.price * item.quantity - (item.discount || 0)), 0)
  );
  //tax = computed(() => this.subtotal() * 0.18);
  total = computed(() => this.subtotal());

  seriesOptions: any = {
    'BOLETA': ['B001', 'B002', 'B003'],
    'FACTURA': ['F001', 'F002', 'F003'],
    'NOTA_DE_VENTA': ['NV001', 'NV002', 'NV003']
  };

  paymentConditions = Object.values(PaymentCondition);
  paymentMethods = Object.values(PaymentMethod);
  PaymentConditionEnum = PaymentCondition;

  constructor(private fb: FormBuilder) {
    this.posForm = this.fb.group({
      documentType: ['BOLETA', Validators.required],
      series: ['B001', Validators.required],
      paymentCondition: [PaymentCondition.CASH, Validators.required],
      initialPayment: [{ value: 0, disabled: true }, [Validators.min(0)]],
      paymentMethod: [PaymentMethod.EFECTIVO],
      dueDate: [null],
      receivedAmount: [0, [Validators.min(0)]],
    });

    this.posForm.get('documentType')?.valueChanges.subscribe(type => {
      const series = this.seriesOptions[type];
      if (series && series.length > 0) {
        this.posForm.patchValue({ series: series[0] });
      }
    });

    this.setupPaymentListeners();

    // Select default customer (00000000) when customers are loaded
    effect(() => {
      const customers = this.customers();
      if (customers.length > 0 && !untracked(this.selectedCustomer)) {
        const defaultCust = customers.find(c => c.documentNumber === '00000000');
        if (defaultCust) {
          untracked(() => this.selectedCustomer.set(defaultCust));
        }
      }
    });
  }

  setupPaymentListeners(): void {
    const conditionCtrl = this.posForm.get('paymentCondition');
    const initialPaymentCtrl = this.posForm.get('initialPayment');
    const paymentMethodCtrl = this.posForm.get('paymentMethod');
    const dueDateCtrl = this.posForm.get('dueDate');

    conditionCtrl?.valueChanges.subscribe(condition => {
      if (condition === PaymentCondition.CASH) {
        initialPaymentCtrl?.disable();
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
  }

  updateQuantity(index: number, newQty: number) {
    if (newQty < 1) return;
    const currentCart = [...this.cart()];
    const item = currentCart[index];
    item.quantity = newQty;
    this.recalculateItemTotal(item);
    this.cart.set(currentCart);
  }

  setDiscountType(index: number, type: 'amount' | 'percentage') {
    const currentCart = [...this.cart()];
    const item = currentCart[index];
    item.discountType = type;
    this.recalculateItemTotal(item);
    this.cart.set(currentCart);
  }

  updateDiscountInput(index: number, val: number) {
    if (val < 0) val = 0;
    const currentCart = [...this.cart()];
    const item = currentCart[index];
    // Asegurar precisión de 2 decimales para moneda
    item.discountInput = Math.round(val * 100) / 100;
    this.recalculateItemTotal(item);
    this.cart.set(currentCart);
  }

  recalculateItemTotal(item: any) {
    const subtotal = item.price * item.quantity;
    let computedDiscount = 0;

    const dVal = item.discountInput || 0;
    if (item.discountType === 'percentage') {
      computedDiscount = subtotal * (dVal / 100);
    } else {
      computedDiscount = dVal;
    }

    if (computedDiscount > subtotal) computedDiscount = subtotal;
    if (computedDiscount < 0) computedDiscount = 0;

    item.discount = computedDiscount;
    item.total = subtotal - computedDiscount;
  }

  removeFromCart(index: number) {
    const currentCart = [...this.cart()];
    currentCart.splice(index, 1);
    this.cart.set(currentCart);
  }

  onCustomerChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;

    if (value === 'null' || !value) {
      this.selectedCustomer.set(null);
    } else {
      const customer = this.customers().find(c => c.id === Number(value));
      this.selectedCustomer.set(customer || null);
    }
  }

  submitSale() {
    if (this.posForm.invalid || this.cart().length === 0) return;

    const formValue = this.posForm.getRawValue();
    const condition = formValue.paymentCondition;
    const initialPayment = formValue.initialPayment || 0;
    const totalAmount = this.total();

    let payments = [];

    if (condition === PaymentCondition.CASH) {
      payments.push({
        paymentMethod: formValue.paymentMethod,
        amount: totalAmount
      });
    } else {
      if (initialPayment > 0) {
        payments.push({
          paymentMethod: formValue.paymentMethod,
          amount: initialPayment
        });
      }
    }

    const saleData = {
      ...formValue,
      items: this.cart(),
      customer: this.selectedCustomer(),
      total: totalAmount,
      payments: payments,
      paymentCondition: condition,
      dueDate: formValue.dueDate
    };
    this.onProcessSale.emit(saleData);
  }
}
