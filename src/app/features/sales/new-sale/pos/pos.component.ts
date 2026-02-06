import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { SaleRequest, PaymentMethod, SaleDocumentType } from '../../../../core/models/sale.model';

interface CartItem {
    product: ProductResponse;
    quantity: number;
    price: number;
    total: number;
}

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ModuleHeaderComponent],
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
    products = signal<ProductResponse[]>([]);
    customers = signal<CustomerResponse[]>([]);
    activeSession = signal<CashSessionResponse | null>(null);
    filteredProducts = signal<ProductResponse[]>([]);

    // Cart Signals
    cart = signal<CartItem[]>([]);
    selectedCustomer = signal<CustomerResponse | null>(null);

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
    }

    ngOnInit(): void {
        this.loadInitialData();
    }

    loadInitialData(): void {
        this.isLoading.set(true);
        forkJoin({
            products: this.productService.getAll(),
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
        const term = this.productSearchTerm.toLowerCase();
        if (!term) {
            this.filteredProducts.set(this.products());
            return;
        }
        this.filteredProducts.set(
            this.products().filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.code.toLowerCase().includes(term)
            )
        );
    }

    addToCart(product: ProductResponse): void {
        const existing = this.cart().find(item => item.product.id === product.id);
        const price = 10.0; // TODO: Usar product.price cuando esté disponible en el modelo

        if (existing) {
            this.cart.update(items => items.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * price }
                    : item
            ));
        } else {
            this.cart.update(items => [...items, { product, quantity: 1, price, total: price }]);
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
            i === index ? { ...item, quantity: qty, total: qty * item.price } : item
        ));
    }

    onSubmitSale(): void {
        const establishmentId = this.establishmentStateService.getSelectedEstablishment();

        if (this.cart().length === 0) {
            this.showAlert('Atención', 'El carrito está vacío', 'warning');
            return;
        }
        if (!establishmentId) {
            this.showAlert('Error', 'No hay un establecimiento seleccionado', 'danger');
            return;
        }

        this.isLoading.set(true);

        const request: SaleRequest = {
            establishmentId: establishmentId!,
            cashSessionId: this.activeSession()?.id,
            customerId: this.selectedCustomer()?.id,
            documentType: this.posForm.value.documentType,
            items: this.cart().map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                unitPrice: item.price
            })),
            payments: [
                {
                    paymentMethod: this.posForm.value.paymentMethod,
                    amount: this.total()
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
                this.posForm.reset({
                    documentType: SaleDocumentType.BOLETA,
                    paymentMethod: PaymentMethod.EFECTIVO,
                    receivedAmount: 0
                });
            },
            error: (err) => {
                console.error('Sale error:', err);
                this.isLoading.set(false);
                this.showAlert('Error', 'No se pudo procesar la venta. Verifique el stock.', 'danger');
            }
        });
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