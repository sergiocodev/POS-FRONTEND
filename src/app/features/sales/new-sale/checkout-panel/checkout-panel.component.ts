import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, signal, computed, effect, untracked, input } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { QuantityInputComponent } from '../../../../shared/components/quantity-input/quantity-input.component';
import { PaymentMethod, PaymentCondition, SaleFormData } from '../../../../core/models/sale.model';
import { SearchableDropdownComponent } from '../../../../shared/components/searchable-dropdown/searchable-dropdown.component';
import { CustomSelectComponent } from '../../../../shared/components/custom-select.component/custom-select.component';

@Component({
  selector: 'app-checkout-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, QuantityInputComponent, SearchableDropdownComponent, CustomSelectComponent],
  templateUrl: './checkout-panel.component.html',
  styleUrl: './checkout-panel.component.scss',
})
export class CheckoutPanelComponent {
  // Using modern Signal Inputs (Angular 17.2+)
  cart = input<any[]>([]);
  customers = input<any[]>([]);
  isLoading = input<boolean>(false);
  preselectedCustomerId = input<number | null>(null);

  @Output() onProcessSale = new EventEmitter<SaleFormData>();
  @Output() onClearCart = new EventEmitter<void>();
  @Output() onAddCustomer = new EventEmitter<void>();
  @Output() onCartChange = new EventEmitter<any[]>();

  posForm: FormGroup;
  selectedCustomer = signal<any>(null);

  // Mapped options for searchable dropdown
  customerOptions = computed(() => {
    return this.customers().map(c => ({ id: c.id, label: c.name }));
  });

  // Payments Management (Signals)
  payments = signal<any[]>([
    { id: this.generateId(), method: PaymentMethod.EFECTIVO, amount: 0, reference: '' }
  ]);

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  // Cálculos Computados
  total = computed(() =>
    this.round(this.cart().reduce((acc, item) => acc + (item.price * item.quantity + (item.adjustment || 0)), 0))
  );
  subtotal = computed(() => {
    return this.round(this.cart().reduce((acc, item) => {
      const itemTotal = item.price * item.quantity + (item.adjustment || 0);
      const rate = item.product.taxRate || 0;
      return acc + (itemTotal / (1 + rate));
    }, 0));
  });
  tax = computed(() => this.round(this.total() - this.subtotal()));

  totalPaid = computed(() =>
    this.round(this.payments().reduce((acc, p) => acc + (p.amount || 0), 0))
  );

  remainingAmount = computed(() => {
    const rem = this.round(this.total() - this.totalPaid());
    return rem > 0 ? rem : 0;
  });

  changeAmount = computed(() => {
    const diff = this.round(this.totalPaid() - this.total());
    return diff > 0 ? diff : 0;
  });

  isPublicoGeneral = computed(() => {
    const cust = this.selectedCustomer();
    return !cust || cust.documentNumber === '00000000';
  });

  seriesOptions: any = {
    'BOLETA': ['B001', 'B002'],
    'FACTURA': ['F001', 'F002'],
    'NOTA_DE_VENTA': ['NV001', 'NV002']
  };

  paymentConditions = Object.values(PaymentCondition);
  paymentMethods = Object.values(PaymentMethod);
  PaymentConditionEnum = PaymentCondition;
  documentOptions = signal([
    { id: 'BOLETA', label: 'BOLETA' },
    { id: 'FACTURA', label: 'FACTURA' },
    { id: 'NOTA_DE_VENTA', label: 'NOTA DE VENTA' }
  ]);

  onDocumentTypeSelect(option: any) {
    this.posForm.patchValue({ documentType: option.id });
  }

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

    // Select default customer when customers are loaded
    effect(() => {
      const customers = this.customers();
      if (customers.length > 0 && !untracked(this.selectedCustomer)) {
        const defaultCust = customers.find(c => c.documentNumber === '00000000');
        if (defaultCust) {
          untracked(() => this.selectedCustomer.set(defaultCust));
        }
      }
    });

    // Handle newly added customer selection
    effect(() => {
      const preselectedId = this.preselectedCustomerId();
      const customersList = this.customers();
      if (preselectedId && customersList.length > 0) {
        const cust = customersList.find(c => c.id === preselectedId);
        if (cust) {
          untracked(() => this.selectedCustomer.set(cust));
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

    // Sync first payment amount with total
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
      { id: this.generateId(), method: PaymentMethod.EFECTIVO, amount: remaining > 0 ? remaining : 0, reference: '' }
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
    this.payments.update(prev => prev.map((p, i) => i === index ? { ...p, amount: this.round(amount) } : p));
  }

  updateReference(index: number, reference: string) {
    this.payments.update(prev => prev.map((p, i) => i === index ? { ...p, reference } : p));
  }

  updateQuantity(index: number, newQty: number) {
    if (newQty < 1) return;
    const currentCart = [...this.cart()];
    currentCart[index] = { ...currentCart[index], quantity: newQty };
    this.recalculateItemTotal(currentCart[index]);
    this.onCartChange.emit(currentCart);
  }

  updatePrice(index: number, newPrice: number) {
    if (newPrice < 0) return;
    const currentCart = [...this.cart()];
    currentCart[index] = { ...currentCart[index], price: newPrice };
    this.recalculateItemTotal(currentCart[index]);
    this.onCartChange.emit(currentCart);
  }

  setAdjustmentType(index: number, type: 'amount' | 'percentage') {
    const currentCart = [...this.cart()];
    currentCart[index] = { ...currentCart[index], adjustmentType: type };
    this.recalculateItemTotal(currentCart[index]);
    this.onCartChange.emit(currentCart);
  }

  updateAdjustmentInput(index: number, val: number) {
    const currentCart = [...this.cart()];
    currentCart[index] = { ...currentCart[index], adjustmentInput: Math.round(val * 100) / 100 };
    this.recalculateItemTotal(currentCart[index]);
    this.onCartChange.emit(currentCart);
  }

  recalculateItemTotal(item: any) {
    const subtotal = item.price * item.quantity;
    let computedAdjustment = 0;
    const val = item.adjustmentInput || 0;
    if (item.adjustmentType === 'percentage') {
      computedAdjustment = this.round(subtotal * (val / 100));
    } else {
      computedAdjustment = val;
    }
    item.adjustment = computedAdjustment;
    item.total = Math.max(0, this.round(subtotal + computedAdjustment));
  }

  public round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  removeFromCart(index: number) {
    const currentCart = this.cart().filter((_, i) => i !== index);
    this.onCartChange.emit(currentCart);
  }

  trackByCartItem(index: number, item: any) {
    return item.product.id;
  }

  onCustomerSelect(option: any) {
    if (!option || option.id === 'null') {
      this.selectedCustomer.set(null);
    } else {
      const customer = this.customers().find(c => c.id === Number(option.id));
      this.selectedCustomer.set(customer || null);
    }
  }

  submitSale() {
    if (this.posForm.invalid || this.cart().length === 0) return;
    const formValue = this.posForm.getRawValue();
    const condition = formValue.paymentCondition;
    const totalAmount = this.total();
    const paidAmount = this.totalPaid();

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
