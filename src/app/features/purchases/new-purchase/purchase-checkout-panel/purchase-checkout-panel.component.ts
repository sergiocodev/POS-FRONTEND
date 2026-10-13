import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, signal, computed, input, inject, effect } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { QuantityInputComponent } from '../../../../shared/components/quantity-input/quantity-input.component';
import { PurchaseDocumentType, PaymentCondition, PaymentMethod, PurchaseRequest } from '../../../../core/models/purchase.model';
import { SearchableDropdownComponent, SelectOption } from '../../../../shared/components/searchable-dropdown/searchable-dropdown.component';
import { SupplierResponse } from '../../../../core/models/supplier.model';
import { SupplierService } from '../../../../core/services/supplier.service';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';
import { PurchaseCartItem } from '../purchase-cart.model';

import { CustomSelectComponent } from '../../../../shared/components/custom-select.component/custom-select.component';

@Component({
  selector: 'app-purchase-checkout-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, QuantityInputComponent, SearchableDropdownComponent, CustomSelectComponent],
  templateUrl: './purchase-checkout-panel.component.html',
  styleUrl: './purchase-checkout-panel.component.scss',
})
export class PurchaseCheckoutPanelComponent {
  cart = input<PurchaseCartItem[]>([]);
  suppliers = input<SupplierResponse[]>([]);
  isLoading = input<boolean>(false);
  preselectedSupplierId = input<number | null>(null);

  @Output() onProcessPurchase = new EventEmitter<PurchaseRequest>();
  @Output() onClearCart = new EventEmitter<void>();
  @Output() onAddSupplier = new EventEmitter<void>();
  @Output() onCartChange = new EventEmitter<PurchaseCartItem[]>();

  private modalService = inject(ModalService);
  private fb = inject(FormBuilder);
  private supplierService = inject(SupplierService);

  posForm: FormGroup;
  selectedSupplier = signal<SupplierResponse | null>(null);
  supplierSearchControl = new FormControl('');
  isSearchingSupplier = signal<boolean>(false);

  @Output() onEditSupplier = new EventEmitter<number>();

  // Cálculos Computados
  total = computed(() =>
    this.round(this.cart().reduce((acc, item) => acc + item.totalCost, 0))
  );
  subtotal = computed(() => {
    return this.round(this.cart().reduce((acc, item) => {
      const rate = item.product.taxTypeRate ?? 0;
      return acc + (item.totalCost / (1 + rate));
    }, 0));
  });
  tax = computed(() => this.round(this.total() - this.subtotal()));

  documentOptions = signal([
    { id: 'BOLETA', label: 'BOLETA' },
    { id: 'FACTURA', label: 'FACTURA' },
    { id: 'GUIA', label: 'GUIA DE REMISION' }
  ]);

  paymentMethods = [
    { value: PaymentMethod.EFECTIVO, label: 'EFECTIVO' },
    { value: PaymentMethod.TRANSFERENCIA, label: 'TRANSFERENCIA' },
    { value: PaymentMethod.YAPE, label: 'YAPE' },
    { value: PaymentMethod.PLIN, label: 'PLIN' },
    { value: PaymentMethod.TARJETA, label: 'TARJETA' }
  ];

  payments = signal<{id: string, method: PaymentMethod, amount: number, reference: string}[]>([
    { id: this.generateId(), method: PaymentMethod.EFECTIVO, amount: 0, reference: '' }
  ]);

  constructor() {
    this.posForm = this.fb.group({
      documentType: ['FACTURA', Validators.required],
      series: ['', Validators.required],
      number: ['', Validators.required],
      issueDate: [new Date().toISOString().split('T')[0], Validators.required],
      paymentCondition: [PaymentCondition.CASH, Validators.required],
      dueDate: [null],
      notes: ['']
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

    // Sync first payment amount with total
    effect(() => {
      const currentTotal = this.total();
      const condition = this.posForm.get('paymentCondition')?.value;
      const currentPayments = this.payments();
      if (condition === PaymentCondition.CASH && currentPayments.length === 1 && currentPayments[0].amount !== currentTotal) {
        this.updatePaymentAmount(0, currentTotal);
      }
    }, { allowSignalWrites: true });

    effect(() => {
        const pId = this.preselectedSupplierId();
        const sups = this.suppliers();
        if (pId && sups.length > 0) {
            const found = sups.find(s => s.id === pId);
            if (found) {
                this.selectedSupplier.set(found);
                this.supplierSearchControl.setValue(found.ruc || found.name, { emitEvent: false });
            }
        }
    }, { allowSignalWrites: true });
  }

  changeAmount = computed(() => {
    const condition = this.posForm.get('paymentCondition')?.value;
    if (condition !== PaymentCondition.CASH) return 0;
    const paid = this.payments().reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, this.round(paid - this.total()));
  });

  remainingAmount = computed(() => {
    const paid = this.payments().reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, this.round(this.total() - paid));
  });

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

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

  updatePaymentMethod(index: number, method: string) {
    this.payments.update(prev => prev.map((p, i) => i === index ? { ...p, method: method as PaymentMethod } : p));
  }

  updatePaymentAmount(index: number, amount: number) {
    this.payments.update(prev => prev.map((p, i) => i === index ? { ...p, amount: this.round(amount) } : p));
  }

  updateReference(index: number, reference: string) {
    this.payments.update(prev => prev.map((p, i) => i === index ? { ...p, reference } : p));
  }

  onDocumentTypeSelect(option: SelectOption): void {
    this.posForm.patchValue({ documentType: option.id });
  }

  updateQuantity(index: number, newQty: number): void {
    if (newQty < 1) return;
    const currentCart = [...this.cart()];
    currentCart[index] = { ...currentCart[index], quantity: newQty };
    this.recalculateItemTotal(currentCart[index]);
    this.onCartChange.emit(currentCart);
  }

  updatePrice(index: number, newPrice: number): void {
    if (newPrice < 0) return;
    const currentCart = [...this.cart()];
    currentCart[index] = { ...currentCart[index], unitCost: newPrice };
    this.recalculateItemTotal(currentCart[index]);
    this.onCartChange.emit(currentCart);
  }
  
  updateLotCode(index: number, val: string): void {
    const currentCart = [...this.cart()];
    currentCart[index] = { ...currentCart[index], lotCode: val };
    this.onCartChange.emit(currentCart);
  }

  updateExpiryDate(index: number, val: string): void {
    const currentCart = [...this.cart()];
    currentCart[index] = { ...currentCart[index], expiryDate: val };
    this.onCartChange.emit(currentCart);
  }

  private recalculateItemTotal(item: PurchaseCartItem): void {
    item.totalCost = this.round(item.unitCost * item.quantity);
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  removeFromCart(index: number): void {
    const currentCart = this.cart().filter((_, i) => i !== index);
    this.onCartChange.emit(currentCart);
  }

  trackByCartItem(index: number, item: PurchaseCartItem): string {
    return item.product.id + '-' + item.unit.id;
  }

  onSupplierSelect(option: SelectOption | null): void {
    if (!option || option.id === 'null') {
      this.selectedSupplier.set(null);
    } else {
      const supplier = this.suppliers().find(s => s.id === Number(option.id));
      this.selectedSupplier.set(supplier || null);
    }
  }

  searchSupplier() {
    let document = this.supplierSearchControl.value;
    if (!document) return;
    document = document.toString().trim();

    const existing = this.suppliers().find(s => s.ruc === document);
    if (existing) {
      this.selectedSupplier.set(existing);
      return;
    }

    this.isSearchingSupplier.set(true);
    this.supplierService.findByDocumentNumber(document).subscribe({
      next: (response) => {
        this.isSearchingSupplier.set(false);
        this.selectedSupplier.set(response.data);
      },
      error: () => {
        // Fallback a API de RENIEC/SUNAT si no existe en BD local
        this.supplierService.searchByDocument(document).subscribe({
          next: (extResponse) => {
            this.isSearchingSupplier.set(false);
            const data = extResponse.data;
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
              this.selectedSupplier.set({
                id: null as any,
                ruc: document,
                name: fullName,
                address: fullAddress,
                phone: '',
                email: '',
                category: 'GENERAL',
                status: 'ACTIVO',
                rating: 0
              });
            } else {
              this.modalService.alert({ title: 'Sin resultados', message: 'No se encontraron datos para este RUC.', type: 'warning' });
            }
          },
          error: () => {
            this.isSearchingSupplier.set(false);
            this.modalService.alert({ title: 'Error', message: 'No se encontró información o hubo un error en la búsqueda.', type: 'error' });
          }
        });
      }
    });
  }

  canEditSupplier(): boolean {
    const supp = this.selectedSupplier();
    return !!(supp && supp.id);
  }

  editSupplier() {
    const supp = this.selectedSupplier();
    if (this.canEditSupplier() && supp?.id) {
      this.onEditSupplier.emit(supp.id);
    }
  }

  addSupplier(): void {
    this.onAddSupplier.emit();
  }

  submitPurchase(): void {
    if (this.posForm.invalid || this.cart().length === 0 || !this.selectedSupplier()) return;
    
    // Check missing lot code or expiry
    const missingData = this.cart().find(c => !c.lotCode || !c.expiryDate);
    if(missingData) {
        this.modalService.alert({title: 'Datos Incompletos', message: 'Debe ingresar el Lote y Fecha de Vencimiento para todos los productos.', type: 'warning'});
        return;
    }

    const selectedSupp = this.selectedSupplier()!;
    
    if (!selectedSupp.id) {
      const newSupplierRequest = {
        name: selectedSupp.name,
        ruc: selectedSupp.ruc,
        address: selectedSupp.address,
        email: selectedSupp.email,
        phone: selectedSupp.phone,
        category: selectedSupp.category || 'GENERAL',
        status: selectedSupp.status || 'ACTIVO',
        rating: selectedSupp.rating || 0
      };

      this.isSearchingSupplier.set(true); // Re-use spinner for UI feedback
      this.supplierService.create(newSupplierRequest).subscribe({
        next: (res) => {
          this.isSearchingSupplier.set(false);
          this.selectedSupplier.set(res.data);
          this.supplierService.invalidateCache();
          this.emitPurchase(res.data.id);
        },
        error: (err) => {
          this.isSearchingSupplier.set(false);
          this.modalService.alert({ title: 'Error', message: 'No se pudo registrar el nuevo proveedor automáticamente.', type: 'error' });
        }
      });
    } else {
      this.emitPurchase(selectedSupp.id);
    }
  }

  private emitPurchase(supplierId: number): void {
    const formValue = this.posForm.getRawValue();

    const request: PurchaseRequest = {
      supplierId: supplierId,
      establishmentId: 0, // Will be set by parent
      documentType: formValue.documentType as PurchaseDocumentType,
      series: formValue.series,
      number: formValue.number,
      issueDate: formValue.issueDate,
      notes: formValue.notes,
      paymentCondition: formValue.paymentCondition,
      dueDate: formValue.dueDate,
      payments: this.payments()
          .filter(p => p.amount > 0)
          .map(p => ({
              method: p.method,
              amount: p.amount,
              reference: p.reference
          })),
      items: this.cart().map(item => ({
          productId: item.product.id,
          productUnitId: item.unit.id,
          lotCode: item.lotCode,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          unitCost: item.unitCost
      }))
    };

    this.onProcessPurchase.emit(request);
  }
}
