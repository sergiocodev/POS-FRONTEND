import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { QuantityInputComponent } from '../quantity-input/quantity-input.component';

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
    'NOTA_VENTA': ['NV001', 'NV002', 'NV003']
  };

  constructor(private fb: FormBuilder) {
    this.posForm = this.fb.group({
      documentType: ['BOLETA', Validators.required],
      series: ['B001', Validators.required],
      paymentMethod: ['EFECTIVO', Validators.required],
      receivedAmount: [0, [Validators.min(0)]],
    });

    this.posForm.get('documentType')?.valueChanges.subscribe(type => {
      const series = this.seriesOptions[type];
      if (series && series.length > 0) {
        this.posForm.patchValue({ series: series[0] });
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

  submitSale() {
    if (this.posForm.invalid || this.cart().length === 0) return;

    const saleData = {
      ...this.posForm.value,
      items: this.cart(),
      customer: this.selectedCustomer(),
      total: this.total()
    };
    this.onProcessSale.emit(saleData);
  }
}
