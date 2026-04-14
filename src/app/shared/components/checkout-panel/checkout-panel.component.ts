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

  // Payments Management (Signals)
  payments = signal<any[]>([
    { id: crypto.randomUUID(), method: PaymentMethod.EFECTIVO, amount: 0, reference: '' }
  ]);

  // Cálculos Computados (Performance Pro)
  subtotal = computed(() =>
    this.cart().reduce((acc, item) => acc + (item.price * item.quantity - (item.discount || 0)), 0)
  );
  //tax = computed(() => this.subtotal() * 0.18);
  total = computed(() => this.subtotal());

  totalPaid = computed(() =>
    this.payments().reduce((acc, p) => acc + (p.amount || 0), 0)
  );

  remainingAmount = computed(() => {
    const rem = this.total() - this.totalPaid();
    return rem > 0 ? rem : 0;
  });

  changeAmount = computed(() => {
    const diff = this.totalPaid() - this.total();
    return diff > 0 ? diff : 0;
  });

  isPublicoGeneral = computed(() => {
    const cust = this.selectedCustomer();
    return !cust || cust.documentNumber === '00000000';
  });

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
      dueDate: [null],
    });

    this.posForm.get('documentType')?.valueChanges.subscribe(type => {
      const series = this.seriesOptions[type];
      if (series && series.length > 0) {
        this.posForm.patchValue({ series: series[0] });
      }
    });

    this.posForm.get('paymentCondition')?.valueChanges.subscribe(condition => {
      const dueDateCtrl = this.posForm.get('dueDate');
      if (condition === PaymentCondition.CASH) {
        dueDateCtrl?.clearValidators();
        dueDateCtrl?.setValue(null, { emitEvent: false });
      } else {
        dueDateCtrl?.setValidators([Validators.required]);
      }
      dueDateCtrl?.updateValueAndValidity();
    });

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

    // Enforce CASH condition if the customer is Publico General
    effect(() => {
      if (this.isPublicoGeneral()) {
        untracked(() => {
          if (this.posForm.get('paymentCondition')?.value !== PaymentCondition.CASH) {
            this.posForm.patchValue({ paymentCondition: PaymentCondition.CASH });
          }
        });
      }
    });

    // Sync first payment amount with total if it's the only one and it was 0 or tied to total
    effect(() => {
      const currentTotal = this.total();
      untracked(() => {
        const currentPayments = this.payments();
        if (currentPayments.length === 1 && currentPayments[0].amount !== currentTotal) {
          this.updatePaymentAmount(0, currentTotal);
        }
      });
    });
  }

  // Payments logic
  addPayment() {
    const remaining = this.remainingAmount();
    if (remaining <= 0 && this.posForm.get('paymentCondition')?.value === PaymentCondition.CASH) return;

    this.payments.update(prev => [
      ...prev,
      { id: crypto.randomUUID(), method: PaymentMethod.EFECTIVO, amount: remaining > 0 ? remaining : 0, reference: '' }
    ]);
  }

  removePayment(index: number) {
    if (this.payments().length <= 1) return;
    this.payments.update(prev => prev.filter((_, i) => i !== index));
  }

  trackPayment(index: number, item: any) {
    return item.id;
  }

  updatePaymentMethod(index: number, method: PaymentMethod) {
    this.payments.update(prev => prev.map((p, i) => i === index ? { ...p, method } : p));
  }

  updatePaymentAmount(index: number, amount: number) {
    this.payments.update(prev => prev.map((p, i) => i === index ? { ...p, amount } : p));
  }



  updateReference(index: number, reference: string) {
    this.payments.update(prev => prev.map((p, i) => i === index ? { ...p, reference } : p));
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
    const totalAmount = this.total();
    const paidAmount = this.totalPaid();

    // Validations
    if (condition === PaymentCondition.CASH && paidAmount < totalAmount) {
      alert('Para venta al contado, el monto total debe ser cubierto.');
      return;
    }

    if (condition === PaymentCondition.CREDIT && paidAmount >= totalAmount) {
      alert('Para venta al crédito, el pago inicial debe ser menor al total.');
      return;
    }

    const saleData = {
      ...formValue,
      items: this.cart(),
      customer: this.selectedCustomer(),
      total: totalAmount,
      payments: this.payments().filter(p => p.amount > 0).map(p => ({
        paymentMethod: p.method,
        amount: p.amount,
        reference: p.reference
      })),
      paymentCondition: condition,
      dueDate: formValue.dueDate
    };
    this.onProcessSale.emit(saleData);
  }

}
