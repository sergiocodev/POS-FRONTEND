import { Component, OnInit, inject, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

// Services & Models (Asegúrate de que las rutas sean correctas)
import { SaleService } from '../../../../core/services/sale.service';
import { ProductService } from '../../../../core/services/product.service';
import { CustomerService } from '../../../../core/services/customer.service';
import { CashSessionService } from '../../../../core/services/cash-session.service';
import { EstablishmentStateService } from '../../../../core/services/establishment-state.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProductResponse } from '../../../../core/models/product.model';
import { CustomerResponse } from '../../../../core/models/customer.model';
import { CashSessionResponse } from '../../../../core/models/cash.model';
import { SaleRequest, PaymentMethod, SaleDocumentType, ProductForSaleResponse } from '../../../../core/models/sale.model';
import { CardGridComponent } from '../../../../shared/components/card-grid/card-grid.component';
import { CheckoutPanelComponent } from '../../../../shared/components/checkout-panel/checkout-panel.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { CustomerFormComponent } from '../../customers/customer-form/customer-form.component';

interface CartItem {
    product: ProductForSaleResponse;
    quantity: number;
    price: number;
    discount: number;
    total: number;
}

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ModuleHeaderComponent, CardGridComponent, CheckoutPanelComponent, ModalGenericComponent, CustomerFormComponent],
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

    // Data Signals
    products = signal<ProductForSaleResponse[]>([]);
    customers = signal<CustomerResponse[]>([]);
    activeSession = signal<CashSessionResponse | null>(null);
    filteredProducts = signal<ProductForSaleResponse[]>([]);

    // Cart Signals
    cart = signal<CartItem[]>([]);
    selectedCustomer = signal<CustomerResponse | null>(null);
    showCustomerModal = signal<boolean>(false);

    // Computed Values
    subtotal = computed(() => this.cart().reduce((sum, item) => sum + item.total, 0));
    tax = computed(() => this.subtotal() * 0.18);
    total = computed(() => this.subtotal());

    posForm: FormGroup;
    isLoading = signal<boolean>(false);
    productSearchTerm = '';

    // Alert System
    alertMessage = '';
    alertTitle = '';
    alertType = 'success';

    constructor() {
        this.posForm = this.fb.group({
            documentType: [SaleDocumentType.BOLETA, Validators.required],
            paymentMethod: [PaymentMethod.EFECTIVO, Validators.required],
            receivedAmount: [0, [Validators.min(0)]]
        });

        // Reaccionar a cambios en el establecimiento seleccionado
        effect(() => {
            const establishmentId = this.establishmentStateService.selectedEstablishmentId();
            if (establishmentId) {
                // untracked previene que las signals leídas dentro de loadInitialData
                // registren dependencias reactivas con este effect.
                untracked(() => {
                    this.loadInitialData();
                });
            }
        });
    }

    ngOnInit(): void {
        // La carga inicial ahora es manejada por el effect en el constructor
        // cuando el establishmentId está disponible.
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
                this.products.set(data.products.data);
                this.filteredProducts.set(data.products.data);
                this.customers.set(data.customers.data);
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
            this.filteredProducts.set(this.products());
            return;
        }

        // Búsqueda por nombre o código de barras
        const matches = this.products().filter(p =>
            p.tradeName.toLowerCase().includes(term) ||
            p.barcode?.toLowerCase().includes(term) ||
            (p.genericName && p.genericName.toLowerCase().includes(term))
        );

        this.filteredProducts.set(matches);

        // Lógica de escáner: Si hay un match exacto por código de barras y es único, agregar al carrito
        const exactBarcodeMatch = this.products().find(p => p.barcode?.toLowerCase() === term);
        if (exactBarcodeMatch && matches.length === 1) {
            this.addToCart(exactBarcodeMatch);
            this.productSearchTerm = '';
            this.filteredProducts.set(this.products());
        }
    }

    addToCart(product: ProductForSaleResponse): void {
        const existing = this.cart().find(item => item.product.id === product.id);
        const price = product.salesPrice;

        if (existing) {
            this.cart.update(items => items.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1, total: ((item.quantity + 1) * price) - item.discount }
                    : item
            ));
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

    removeFromCart(index: number): void {
        this.cart.update(items => items.filter((_, i) => i !== index));
    }

    updateQuantity(index: number, qty: number): void {
        if (qty <= 0) {
            this.removeFromCart(index);
            return;
        }
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
                lotId: item.product.lotId,
                quantity: item.quantity,
                unitPrice: item.price,
                discountAmount: item.discount || 0,
                discountReason: (item.discount || 0) > 0 ? 'Descuento Manual POS' : undefined
            })),
            payments: [
                {
                    paymentMethod: saleData.paymentMethod,
                    amount: saleData.total
                }
            ]
        };

        const userId = this.authService.currentUser()?.id || 1;

        this.saleService.create(request, userId).subscribe({
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

    onSubmitSale(): void {
        // Redirigido a onProcessSale manejado por el CheckoutPanelComponent
    }

    onCustomerSaveSuccess(): void {
        this.showCustomerModal.set(false);
        this.showAlert('Éxito', 'Cliente guardado correctamente', 'success');
        // Recargar lista de clientes
        this.customerService.getAll().subscribe({
            next: (data) => {
                this.customers.set(data.data);
            }
        });
    }

    closeCustomerModal(): void {
        this.showCustomerModal.set(false);
    }

    getDaysToExpire(dateString: string | undefined): number | string {
        if (!dateString) return '';

        const parts = dateString.split('-');
        if (parts.length !== 3) return '';

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);

        const expDate = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = expDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Helpers UI
    showAlert(title: string, message: string, type: string) {
        this.alertTitle = title;
        this.alertMessage = message;
        this.alertType = type;
        setTimeout(() => this.closeAlert(), 4000);
    }

    closeAlert() {
        this.alertMessage = '';
    }
}