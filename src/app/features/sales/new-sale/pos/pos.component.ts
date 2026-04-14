import { Component, OnInit, inject, signal, computed, effect, untracked, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Subject, timer, map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

// Services & Models
import { SaleService } from '../../../../core/services/sale.service';
import { ProductService } from '../../../../core/services/product.service';
import { CustomerService } from '../../../../core/services/customer.service';
import { CashSessionService } from '../../../../core/services/cash-session.service';
import { EstablishmentStateService } from '../../../../core/services/establishment-state.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CustomerResponse } from '../../../../core/models/customer.model';
import { CashSessionResponse } from '../../../../core/models/cash.model';
import { SaleRequest, PaymentMethod, SaleDocumentType, ProductForSaleResponse } from '../../../../core/models/sale.model';
import { CardGridComponent } from '../../../../shared/components/card-grid/card-grid.component';
import { CheckoutPanelComponent } from '../../../../shared/components/checkout-panel/checkout-panel.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { CustomerFormComponent } from '../../customers/customer-form/customer-form.component';

export interface CartItem {
    product: ProductForSaleResponse;
    quantity: number;
    price: number;
    discount: number;
    discountInput: number;
    discountType: 'amount' | 'percentage';
    total: number;
}

/** Pre-computed display data for a unit in the modal */
export interface UnitDisplayData {
    unit: ProductForSaleResponse;
    fullPacks: number;
    remainder: number;
    stockLabel: string;
}

/** Stock breakdown for a given unit factor */
export interface StockBreakdown {
    fullPacks: number;
    remainder: number;
    availableInUnit: number; // floor(baseStock / factor)
}

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule,
        ModuleHeaderComponent, CardGridComponent,
        CheckoutPanelComponent, ModalGenericComponent, CustomerFormComponent
    ],
    templateUrl: './pos.component.html',
    styleUrl: './pos.component.scss'
})
export class PosComponent implements OnInit {
    private fb = inject(FormBuilder);
    private saleService = inject(SaleService);
    private productService = inject(ProductService);
    private customerService = inject(CustomerService);
    private cashSessionService = inject(CashSessionService);
    private authService = inject(AuthService);
    private establishmentStateService = inject(EstablishmentStateService);
    public router = inject(Router);
    private destroyRef = inject(DestroyRef);

    // Data Signals
    products = signal<ProductForSaleResponse[]>([]);        // Full list (all units per product)
    displayProducts = signal<ProductForSaleResponse[]>([]); // Deduplicated (1 card per product+lot)
    customers = signal<CustomerResponse[]>([]);
    activeSession = signal<CashSessionResponse | null>(null);
    filteredProducts = signal<ProductForSaleResponse[]>([]); // Filtered deduplicated list for grid

    // Cart Signals
    cart = signal<CartItem[]>([]);
    selectedCustomer = signal<CustomerResponse | null>(null);
    showCustomerModal = signal<boolean>(false);

    // Stock warning
    stockWarning = signal<string | null>(null);

    // Unit Selector Modal
    showUnitModal = signal<boolean>(false);
    unitModalProduct = signal<ProductForSaleResponse | null>(null);  // The clicked product card
    availableUnits = signal<ProductForSaleResponse[]>([]);           // All units for that product+lot
    unitDisplayData = signal<UnitDisplayData[]>([]);                 // Pre-computed for template

    // Computed Values
    subtotal = computed(() => this.cart().reduce((sum, item) => sum + item.total, 0));
    tax = computed(() => this.subtotal() * 0.18);
    total = computed(() => this.subtotal() + this.tax());

    posForm: FormGroup;
    isLoading = signal<boolean>(false);
    productSearchTerm = '';
    private searchSubject = new Subject<string>();

    // Alert System (signals)
    alertMessage = signal('');
    alertTitle = signal('');
    alertType = signal<'success'|'danger'|'warning'|'info'>('success');

    constructor() {
        this.posForm = this.fb.group({
            documentType: [SaleDocumentType.BOLETA, Validators.required],
            paymentMethod: [PaymentMethod.EFECTIVO, Validators.required]
        });

        effect(() => {
            const establishmentId = this.establishmentStateService.selectedEstablishmentId();
            if (establishmentId) {
                untracked(() => {
                    this.loadInitialData();
                });
            }
        });
    }

    ngOnInit(): void {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term.trim()) {
                    return [this.displayProducts()];
                }
                const estId = this.establishmentStateService.getSelectedEstablishment();
                if (!estId) return [];
                return this.saleService.searchProductsForPOS(term.trim(), estId).pipe(
                    map(response => {
                        return this.deduplicateForGrid(response.data);
                    })
                );
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(results => {
            if (Array.isArray(results)) {
                this.filteredProducts.set(results);
            }
        });
    }

    loadInitialData(): void {
        const establishmentId = this.establishmentStateService.getSelectedEstablishment();
        if (!establishmentId) {
            this.showAlert('Error', 'Establecimiento no seleccionado.', 'danger');
            return;
        }

        this.isLoading.set(true);
        forkJoin({
            products: this.saleService.listProductsForSale(establishmentId),
            customers: this.customerService.getAll(),
            activeSession: this.cashSessionService.getActiveSession()
        }).subscribe({
            next: (data) => {
                const allUnits = data.products.data;
                const deduped = this.deduplicateForGrid(allUnits);
                this.products.set(allUnits);        // full list → used by modal
                this.displayProducts.set(deduped);  // 1 per product+lot → used by grid
                this.filteredProducts.set(deduped);
                const customers = data.customers.data;
                this.customers.set(customers);
                
                // Select default customer (00000000) if no customer is selected
                if (!this.selectedCustomer()) {
                    const defaultCust = customers.find(c => c.documentNumber === '00000000');
                    if (defaultCust) {
                        this.selectedCustomer.set(defaultCust);
                    }
                }

                this.activeSession.set(data.activeSession.data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading POS data:', err);
                this.isLoading.set(false);
                this.showAlert('Error', 'Debe abrir una caja antes de realizar ventas.', 'danger');
                setTimeout(() => this.router.navigate(['/cash']), 2000);
            }
        });
    }

    onProductSearch(): void {
        const term = this.productSearchTerm.trim().toLowerCase();
        if (!term) {
            this.searchSubject.next('');
            return;
        }

        // Barcode scanner: avoid matching if multiple lots share the exact same barcode
        const exactBarcodeMatches = this.products().filter(p => p.barcode?.toLowerCase() === term);

        if (exactBarcodeMatches.length === 1) {
            this.addToCartDirect(exactBarcodeMatches[0]);
            this.productSearchTerm = '';
            this.filteredProducts.set(this.displayProducts());
            return;
        }

        // Debounced backend search
        this.searchSubject.next(this.productSearchTerm);
    }

    /**
     * Called when user clicks a product card.
     * Groups all units for that product+lot and opens the unit selector modal.
     * If only one unit exists, adds directly to cart.
     */
    openUnitSelector(product: ProductForSaleResponse): void {
        // Collect all unit entries for the same product + lot
        const units = this.products().filter(
            p => p.productId === product.productId && p.lotId === product.lotId
        );

        if (units.length <= 1) {
            // Only one unit available — add directly
            this.addToCartDirect(product);
            return;
        }

        // Sort: base unit (factor=1) first, then by factor asc
        units.sort((a, b) => a.factor - b.factor);

        // Pre-compute display data for the template (avoids repeated method calls)
        const displayData: UnitDisplayData[] = units.map(unit => {
            const base = unit.stock || 0;
            const factor = unit.factor || 1;
            if (factor === 1) {
                return { unit, fullPacks: base, remainder: 0, stockLabel: `${base} disponibles` };
            }
            const full = Math.floor(base / factor);
            const rem = base % factor;
            const stockLabel = rem === 0
                ? `${full} ${unit.unitName || 'unidades'} completos`
                : `${full} completos + ${rem} sueltas`;
            return { unit, fullPacks: full, remainder: rem, stockLabel };
        });

        this.unitModalProduct.set(product);
        this.availableUnits.set(units);
        this.unitDisplayData.set(displayData);
        this.showUnitModal.set(true);
    }

    closeUnitModal(): void {
        this.showUnitModal.set(false);
        this.unitModalProduct.set(null);
        this.availableUnits.set([]);
        this.unitDisplayData.set([]);
    }

    selectUnit(unit: ProductForSaleResponse): void {
        this.addToCartDirect(unit);
        this.closeUnitModal();
    }

    /** Core cart add logic (used by modal confirm and barcode scanner) */
    addToCartDirect(product: ProductForSaleResponse): void {
        const price = product.salesPrice;
        const baseStock = product.stock || 0;

        // Find existing item by productId + productUnitId + lotId
        const existingIndex = this.cart().findIndex(
            i => i.product.productId === product.productId &&
                 i.product.productUnitId === product.productUnitId &&
                 i.product.lotId === product.lotId
        );

        // Calculate the quantity that would be in cart after adding
        const currentQty = existingIndex >= 0 ? this.cart()[existingIndex].quantity : 0;
        const newQty = currentQty + 1;

        // Stock validation warning (server will enforce on submit)
        const effectiveStock = baseStock / (product.factor || 1);
        if (newQty > effectiveStock && effectiveStock > 0) {
            this.stockWarning.set(`⚠️ Stock insuficiente: ${product.tradeName} — disponible: ${Math.floor(effectiveStock)}, en carrito: ${newQty}`);
            timer(5000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.stockWarning.set(null));
        } else if (baseStock <= 0) {
            this.stockWarning.set(`⚠️ Sin stock: ${product.tradeName}`);
            timer(5000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.stockWarning.set(null));
        } else {
            this.stockWarning.set(null);
        }

        if (existingIndex >= 0) {
            this.cart.update(items => items.map((item, idx) => {
                if (idx !== existingIndex) return item;
                return { ...item, quantity: newQty, total: (newQty * item.price) - item.discount };
            }));
        } else {
            this.cart.update(items => [...items, {
                product,
                quantity: 1,
                price,
                discount: 0,
                discountInput: 0,
                discountType: 'amount',
                total: price
            }]);
        }
    }

    // ---------- Stock conversion helpers ----------

    /**
     * Returns one representative card per productId+lotId for the grid.
     * Picks the entry with the smallest factor (base unit) as the card representative.
     */
    private deduplicateForGrid(all: ProductForSaleResponse[]): ProductForSaleResponse[] {
        const seen = new Map<string, ProductForSaleResponse>();
        for (const p of all) {
            const key = `${p.productId}_${p.lotId}`;
            const existing = seen.get(key);
            // Keep the entry with the smallest factor as representative
            if (!existing || p.factor < existing.factor) {
                seen.set(key, p);
            }
        }
        return Array.from(seen.values());
    }

    /**
     * Returns how much stock is available expressed in the given unit.
     * Example: baseStock=145, factor=10 → { fullPacks:14, remainder:5, availableInUnit:14 }
     */
    getStockBreakdown(baseStock: number, factor: number): StockBreakdown {
        const f = factor || 1;
        return {
            fullPacks: Math.floor(baseStock / f),
            remainder: baseStock % f,
            availableInUnit: Math.floor(baseStock / f)
        };
    }

    getStockLabel(unit: ProductForSaleResponse): string {
        const base = unit.stock || 0;
        const factor = unit.factor || 1;
        if (factor === 1) {
            return `${base} disponibles`;
        }
        const full = Math.floor(base / factor);
        const rem = base % factor;
        if (rem === 0) {
            return `${full} ${unit.unitName || 'unidades'} completos`;
        }
        return `${full} completos + ${rem} sueltas`;
    }

    // ---------- Cart management ----------

    removeFromCart(index: number): void {
        this.cart.update(items => items.filter((_, i) => i !== index));
    }

    updateQuantity(index: number, qty: number): void {
        if (qty <= 0) { this.removeFromCart(index); return; }
        this.cart.update(items => items.map((item, i) =>
            i === index ? { ...item, quantity: qty, total: (qty * item.price) - item.discount } : item
        ));
    }

    updateDiscount(index: number, discount: number): void {
        if (discount < 0) discount = 0;
        this.cart.update(items => items.map((item, i) =>
            i === index ? { ...item, discount, total: (item.quantity * item.price) - discount } : item
        ));
    }

    // ---------- Sale submission ----------

    onProcessSale(saleData: any): void {
        const establishmentId = this.establishmentStateService.getSelectedEstablishment();
        if (!establishmentId) {
            this.showAlert('Error', 'No hay un establecimiento seleccionado', 'danger');
            return;
        }

        this.isLoading.set(true);

        const request: SaleRequest = {
            establishmentId: establishmentId!,
            cashSessionId: this.activeSession()?.id,
            customerId: saleData.customer?.id,
            documentType: saleData.documentType,
            series: saleData.series,
            items: saleData.items.map((item: any) => ({
                productId: item.product.productId,
                productUnitId: item.product.productUnitId,
                lotId: item.product.lotId,
                quantity: item.quantity,
                unitPrice: item.price,
                discountAmount: item.discount || 0,
                discountReason: (item.discount || 0) > 0 ? 'Descuento Manual POS' : undefined
            })),
            payments: saleData.payments.map((p: any) => ({
                ...p,
                cashSessionId: this.activeSession()?.id
            })),
            paymentCondition: saleData.paymentCondition,
            dueDate: saleData.dueDate
        };

        this.saleService.create(request).subscribe({
            next: (response) => {
                const res = response.data;
                this.isLoading.set(false);
                this.showAlert('Éxito', `Venta registrada! Comprobante: ${res.series}-${res.number}`, 'success');
                this.cart.set([]);
            },
            error: (err) => {
                console.error('Sale error:', err);
                this.isLoading.set(false);
                this.showAlert('Error', 'No se pudo procesar la venta. Verifique el stock.', 'danger');
            }
        });
    }

    onCustomerSaveSuccess(): void {
        this.showCustomerModal.set(false);
        this.showAlert('Éxito', 'Cliente guardado correctamente', 'success');
        this.customerService.getAll().subscribe({
            next: (data) => { this.customers.set(data.data); }
        });
    }

    closeCustomerModal(): void {
        this.showCustomerModal.set(false);
    }

    getDaysToExpire(dateString: string | undefined): number | string {
        if (!dateString) return '';
        const parts = dateString.split('-');
        if (parts.length !== 3) return '';
        const expDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    showAlert(title: string, message: string, type: 'success'|'danger'|'warning'|'info') {
        this.alertTitle.set(title);
        this.alertMessage.set(message);
        this.alertType.set(type);
        timer(4000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.closeAlert());
    }

    closeAlert() { this.alertMessage.set(''); }
}