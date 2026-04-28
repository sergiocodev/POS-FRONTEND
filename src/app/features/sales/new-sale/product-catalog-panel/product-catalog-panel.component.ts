import { Component, OnInit, inject, signal, computed, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerResponse } from '../../../../core/models/customer.model';
import { SaleDocumentType, PaymentMethod, ProductForSaleResponse } from '../../../../core/models/sale.model';
import { CardGridComponent } from '../../../../shared/components/card-grid/card-grid.component';
import { CheckoutPanelComponent } from '../checkout-panel/checkout-panel.component';

export interface CartItem {
    product: ProductForSaleResponse;
    quantity: number;
    price: number;
    adjustment: number;
    adjustmentInput: number;
    adjustmentType: 'amount' | 'percentage';
    total: number;
    stock: number;
}

export interface UnitDisplayData {
    unit: ProductForSaleResponse;
    fullPacks: number;
    remainder: number;
    stockLabel: string;
}

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule,
        CardGridComponent,
        CheckoutPanelComponent
    ],
    templateUrl: './product-catalog-panel.component.html',
    styleUrl: './product-catalog-panel.component.scss'
})
export class ProductCatalogPanelComponent implements OnInit, OnChanges {
    private fb = inject(FormBuilder);

    // Inputs from Container
    @Input() products: ProductForSaleResponse[] = [];
    @Input() displayProducts: ProductForSaleResponse[] = [];
    @Input() customers: CustomerResponse[] = [];
    @Input() filteredProducts: ProductForSaleResponse[] = [];
    @Input() cart: CartItem[] = [];
    @Input() selectedCustomer: CustomerResponse | null = null;
    @Input() isLoading = false;

    // Outputs to Container
    @Output() productSearch = new EventEmitter<string>();
    @Output() processSale = new EventEmitter<any>();
    @Output() updateCart = new EventEmitter<CartItem[]>();
    @Output() updateSelectedCustomer = new EventEmitter<CustomerResponse | null>();
    @Output() openCustomerModal = new EventEmitter<void>();

    // Local UI State
    productSearchTerm = '';
    posForm: FormGroup;

    // Unit Selector Modal Local State
    showUnitModal = signal<boolean>(false);
    unitModalProduct = signal<ProductForSaleResponse | null>(null);
    availableUnits = signal<ProductForSaleResponse[]>([]);
    unitDisplayData = signal<UnitDisplayData[]>([]);

    // Computed Values
    total = computed(() => this.cart.reduce((sum, item) => sum + item.total, 0));
    subtotal = computed(() => {
        return this.cart.reduce((acc, item) => {
            const rate = item.product.taxRate || 0;
            return acc + (item.total / (1 + rate));
        }, 0);
    });
    tax = computed(() => this.total() - this.subtotal());

    constructor() {
        this.posForm = this.fb.group({
            documentType: [SaleDocumentType.BOLETA, Validators.required],
            paymentMethod: [PaymentMethod.EFECTIVO, Validators.required]
        });
    }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void { }

    onProductSearch(): void {
        const term = this.productSearchTerm.trim().toLowerCase();

        // Barcode scanner check: if exact barcode exists, add directly
        const exactBarcodeMatches = this.products.filter(p => p.barcode?.toLowerCase() === term);
        if (exactBarcodeMatches.length === 1) {
            this.addToCartDirect(exactBarcodeMatches[0]);
            this.productSearchTerm = '';
            this.productSearch.emit('');
            return;
        }

        this.productSearch.emit(this.productSearchTerm);
    }

    openUnitSelector(product: ProductForSaleResponse): void {
        const units = this.products.filter(
            p => p.productId === product.productId && p.lotId === product.lotId
        );

        if (units.length <= 1) {
            this.addToCartDirect(product);
            return;
        }

        units.sort((a, b) => a.factor - b.factor);

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
    }

    selectUnit(unit: ProductForSaleResponse): void {
        this.addToCartDirect(unit);
        this.closeUnitModal();
    }

    addToCartDirect(product: ProductForSaleResponse): void {
        const price = product.salesPrice;
        const baseStock = product.stock || 0;
        const existingIndex = this.cart.findIndex(
            i => i.product.productId === product.productId &&
                i.product.productUnitId === product.productUnitId &&
                i.product.lotId === product.lotId
        );

        const currentQty = existingIndex >= 0 ? this.cart[existingIndex].quantity : 0;
        const newQty = currentQty + 1;
        const effectiveStock = baseStock / (product.factor || 1);

        if (baseStock <= 0) return; // In a presentational component, we might want to emit a "warning" instead
        if (newQty > effectiveStock) return;

        let newCart = [...this.cart];
        if (existingIndex >= 0) {
            newCart[existingIndex] = {
                ...newCart[existingIndex],
                quantity: newQty,
                total: Math.max(0, (newQty * newCart[existingIndex].price) + (newCart[existingIndex].adjustment || 0))
            };
        } else {
            newCart.push({
                product,
                quantity: 1,
                price,
                adjustment: 0,
                adjustmentInput: 0,
                adjustmentType: 'amount',
                total: price,
                stock: effectiveStock
            });
        }
        this.updateCart.emit(newCart);
    }

    removeFromCart(index: number): void {
        const newCart = this.cart.filter((_, i) => i !== index);
        this.updateCart.emit(newCart);
    }

    updateQuantity(index: number, qty: number): void {
        if (qty <= 0) { this.removeFromCart(index); return; }
        const currentItem = this.cart[index];
        if (qty > currentItem.stock) qty = currentItem.stock;

        const newCart = this.cart.map((item, i) =>
            i === index ? { ...item, quantity: qty, total: Math.max(0, (qty * item.price) + (item.adjustment || 0)) } : item
        );
        this.updateCart.emit(newCart);
    }

    updateAdjustment(index: number, adjustment: number): void {
        const item = this.cart[index];
        const subtotal = item.quantity * item.price;
        if (subtotal + adjustment < 0) adjustment = -subtotal;

        const newCart = this.cart.map((item, i) =>
            i === index ? { ...item, adjustment, total: (item.quantity * item.price) + adjustment } : item
        );
        this.updateCart.emit(newCart);
    }

    onProcessSale(saleData: any): void {
        this.processSale.emit(saleData);
    }

    onOpenCustomerModal(): void {
        this.openCustomerModal.emit();
    }


    onUpdateSelectedCustomer(customer: CustomerResponse | null): void {
        this.updateSelectedCustomer.emit(customer);
    }

    // Helper for template
    getDaysToExpire(dateString: string | undefined): number | string {
        if (!dateString) return '';
        const parts = dateString.split('-');
        if (parts.length !== 3) return '';
        const expDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
}