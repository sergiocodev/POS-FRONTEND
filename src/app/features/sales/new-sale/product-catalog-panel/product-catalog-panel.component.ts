import { Component, OnInit, inject, signal, computed, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { CustomerResponse } from '../../../../core/models/customer.model';
import { SaleDocumentType, PaymentMethod, ProductForSaleResponse, CartItem } from '../../../../core/models/sale.model';
import { CardGridComponent } from '../../../../shared/components/card-grid/card-grid.component';
import { SaleService } from '../../../../core/services/sale.service';
import { EstablishmentStateService } from '../../../../core/services/establishment-state.service';

export interface UnitDisplayData {
    unit: ProductForSaleResponse;
    fullPacks: number;
    remainder: number;
    stockLabel: string;
}

@Component({
    selector: 'app-product-catalog-panel',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule,
        CardGridComponent,
        ZXingScannerModule
    ],
    templateUrl: './product-catalog-panel.component.html',
    styleUrl: './product-catalog-panel.component.scss'
})
export class ProductCatalogPanelComponent implements OnInit, OnChanges {
    private fb = inject(FormBuilder);
    private saleService = inject(SaleService);
    private establishmentStateService = inject(EstablishmentStateService);

    // Inputs from Container
    @Input() products: ProductForSaleResponse[] = [];
    @Input() displayProducts: ProductForSaleResponse[] = [];
    @Input() filteredProducts: ProductForSaleResponse[] = [];
    @Input() cart: CartItem[] = [];
    @Input() isLoading = false;

    // Outputs to Container
    @Output() productSearch = new EventEmitter<string>();
    @Output() updateCart = new EventEmitter<CartItem[]>();
    @Output() imagesLoadingStatus = new EventEmitter<boolean>();

    // Local UI State
    productSearchTerm = '';
    posForm: FormGroup;

    // Unit Selector Modal Local State
    showUnitModal = signal<boolean>(false);
    unitModalProduct = signal<ProductForSaleResponse | null>(null);
    availableUnits = signal<ProductForSaleResponse[]>([]);
    unitDisplayData = signal<UnitDisplayData[]>([]);

    // Scanner Local State
    isScannerOpen = signal<boolean>(false);
    scannerEnabled = signal<boolean>(true);
    hasPermission = signal<boolean | null>(null);
    currentDevice = signal<MediaDeviceInfo | undefined>(undefined);
    allowedFormats = [ BarcodeFormat.EAN_13 ];

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
        // Normal text search (emitted to parent, debounced there)
        this.productSearch.emit(term);
    }

    onBarcodeScan(): void {
        const term = this.productSearchTerm.trim().toLowerCase();
        if (!term) return;

        const estId = this.establishmentStateService.getSelectedEstablishment();
        if (!estId) return;

        // Use the native backend API to ensure FEFO and get exact unit
        this.saleService.getProductByBarcodeScan(term, estId).subscribe({
            next: (res) => {
                const data = res.data;
                if (data && data.productId && data.productUnitId) {
                    // Match found! Reconstruct it or find it in local products to add to cart
                    const matchedProduct = this.products.find(p =>
                        p.productId === data.productId &&
                        p.productUnitId === data.productUnitId &&
                        p.lotId === data.lotId
                    );

                    if (matchedProduct) {
                        this.addToCartDirect(matchedProduct);
                        this.productSearchTerm = '';
                        this.productSearch.emit('');
                    } else {
                        // Edge case: product found in backend API but not in the local this.products array (maybe pagination in future)
                        // For now we map it manually
                        const fallbackProduct: ProductForSaleResponse = {
                            id: data.productId, // Mock ID
                            productId: data.productId,
                            productUnitId: data.productUnitId,
                            tradeName: data.tradeName,
                            unitName: data.unitName,
                            factor: data.factor,
                            barcode: data.barcode,
                            salesPrice: data.salesPrice,
                            lotId: data.lotId,
                            lotCode: data.lotCode,
                            expirationDate: data.expiryDate,
                            stock: data.availableStock,
                            taxRate: data.taxRate,
                            description: '', presentation: '', concentration: '', category: '', laboratory: ''
                        };
                        this.addToCartDirect(fallbackProduct);
                        this.productSearchTerm = '';
                        this.productSearch.emit('');
                    }
                }
            },
            error: (err) => {
                console.error("Barcode scan failed", err);
            }
        });
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

    // Scanner Methods
    openScanner(): void {
        this.isScannerOpen.set(true);
        this.scannerEnabled.set(true);
        this.hasPermission.set(null); // Reset
    }

    closeScanner(): void {
        this.isScannerOpen.set(false);
        this.scannerEnabled.set(false);
        this.currentDevice.set(undefined);
    }

    onHasPermission(has: boolean): void {
        this.hasPermission.set(has);
        if (!has) {
            console.error('No se concedieron permisos de cámara');
        }
    }

    camerasFoundHandler(cameras: MediaDeviceInfo[]): void {
        if (cameras && cameras.length > 0) {
            // Intentar buscar la cámara trasera por defecto
            const backCamera = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('trasera') || c.label.toLowerCase().includes('environment'));
            this.currentDevice.set(backCamera || cameras[0]);
        }
    }

    camerasNotFoundHandler(event: any): void {
        console.error('No se encontraron cámaras', event);
        this.hasPermission.set(false);
    }

    private playBeep(): void {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const audioCtx = new AudioContextClass();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz beep
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1); // Beep duration 0.1s
        } catch (e) {
            console.warn('AudioContext no soportado o silenciado por el navegador');
        }
    }

    onScanSuccess(result: string): void {
        if (!result) return;
        this.playBeep();
        this.closeScanner();
        this.productSearchTerm = result;
        this.onBarcodeScan();
    }
    
    onScanError(error: any): void {
        // Ignored or logged implicitly by library
    }
}