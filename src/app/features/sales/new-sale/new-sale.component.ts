import { Component, OnInit, inject, signal, effect, untracked, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { forkJoin, Subject, timer, map, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

// Services & Models
import { SaleService } from '../../../core/services/sale.service';
import { ProductService } from '../../../core/services/product.service';
import { CustomerService } from '../../../core/services/customer.service';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { CustomerResponse } from '../../../core/models/customer.model';
import { CashSessionResponse } from '../../../core/models/cash.model';
import { SaleRequest, ProductForSaleResponse } from '../../../core/models/sale.model';
import { CartItem } from './product-catalog-panel/product-catalog-panel.component';
import { ProductCatalogPanelComponent } from './product-catalog-panel/product-catalog-panel.component';
import { CheckoutPanelComponent } from './checkout-panel/checkout-panel.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { CustomerFormComponent } from '../customers/customer-form/customer-form.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CashOpenComponent } from '../../box/opening-closing/box-details/cash-open/cash-open.component';

@Component({
    selector: 'app-new-sale',
    standalone: true,
    imports: [
        ProductCatalogPanelComponent,
        CheckoutPanelComponent,
        ModalGenericComponent,
        CustomerFormComponent,
        ModuleHeaderComponent,
        ModalAlertComponent,
        ConfirmModalComponent,
        SpinnerComponent,
        CashOpenComponent
    ],
    templateUrl: './new-sale.component.html',
    styleUrl: './new-sale.component.scss'
})
export class NewSaleComponent implements OnInit {
    private saleService = inject(SaleService);
    private productService = inject(ProductService);
    private customerService = inject(CustomerService);
    private cashSessionService = inject(CashSessionService);
    private establishmentStateService = inject(EstablishmentStateService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);
    private modalService = inject(ModalService);

    // State Signals
    products = signal<ProductForSaleResponse[]>([]);
    displayProducts = signal<ProductForSaleResponse[]>([]);
    customers = signal<CustomerResponse[]>([]);
    activeSession = signal<CashSessionResponse | null>(null);
    filteredProducts = signal<ProductForSaleResponse[]>([]);
    isLoading = signal<boolean>(false);
    isImagesLoading = signal<boolean>(false);

    // Cart Signals
    cart = signal<CartItem[]>([]);
    selectedCustomer = signal<CustomerResponse | null>(null);

    // UI/Modal State
    showCustomerModal = signal<boolean>(false);
    showOpenModal = signal<boolean>(false);
    isCartOpen = signal<boolean>(false);

    private searchSubject = new Subject<string>();

    constructor() {
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
            this.modalService.alert({ title: 'Error', message: 'Establecimiento no seleccionado.', type: 'error' });
            return;
        }

        this.isLoading.set(true);
        forkJoin({
            products: this.saleService.listProductsForSale(establishmentId),
            customers: this.customerService.getAll(),
            activeSession: this.cashSessionService.getActiveSession().pipe(
                catchError(() => of(null)) // Catch errors like 404 No Active Session
            )
        }).subscribe({
            next: (data) => {
                const allUnits = data.products.data;
                const deduped = this.deduplicateForGrid(allUnits);
                this.products.set(allUnits);
                this.displayProducts.set(deduped);
                this.filteredProducts.set(deduped);
                const customers = data.customers.data;
                this.customers.set(customers);

                if (!this.selectedCustomer()) {
                    const defaultCust = customers.find(c => c.documentNumber === '00000000');
                    if (defaultCust) {
                        this.selectedCustomer.set(defaultCust);
                    }
                }

                const session = data.activeSession?.data;

                // Validar estrictamente que haya sesión y esté ABIERTA
                if (session && session.status === 'OPEN') {
                    this.activeSession.set(session);
                } else {
                    this.activeSession.set(null);
                    this.modalService.alert({
                        title: 'Error',
                        message: 'Debe abrir una caja antes de realizar ventas',
                        type: 'warning',
                        buttonText: 'Ok'
                    }).then(() => {
                        this.showOpenModal.set(true);
                    });
                }

                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading POS data:', err);
                this.isLoading.set(false);
                this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los datos del sistema.', type: 'error' });
            }
        });
    }

    onOpenSaved(): void {
        this.showOpenModal.set(false);
        this.loadInitialData(); // Recargamos para obtener los productos y clientes
    }

    onOpenCanceled(): void {
        this.showOpenModal.set(false);
        this.router.navigate(['/home']); // Redirigimos al home si decide no abrir la caja
    }

    private deduplicateForGrid(all: ProductForSaleResponse[]): ProductForSaleResponse[] {
        const seen = new Map<string, ProductForSaleResponse>();
        for (const p of all) {
            const key = `${p.productId}_${p.lotId}`;
            const existing = seen.get(key);
            if (!existing || p.factor < existing.factor) {
                seen.set(key, p);
            }
        }
        return Array.from(seen.values());
    }

    onProductSearch(term: string): void {
        this.searchSubject.next(term);
    }

    onProcessSale(saleData: any): void {
        const establishmentId = this.establishmentStateService.getSelectedEstablishment();
        if (!establishmentId) {
            this.modalService.alert({ title: 'Error', message: 'No hay un establecimiento seleccionado', type: 'error' });
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
                discountAmount: (item.adjustment || 0) < 0 ? Math.abs(item.adjustment) : 0,
                discountReason: (item.adjustment || 0) < 0 ? 'Ajuste POS (Dscto)' : undefined,
                increaseAmount: (item.adjustment || 0) > 0 ? item.adjustment : 0,
                increaseReason: (item.adjustment || 0) > 0 ? 'Ajuste POS (Aumento)' : undefined
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
                this.modalService.alert({ title: 'Éxito', message: `Venta registrada!<br>${res.series}-${res.number}`, type: 'success' });
                this.cart.set([]);
            },
            error: (err) => {
                console.error('Sale error:', err);
                this.isLoading.set(false);
                this.modalService.alert({ title: 'Error', message: 'No se pudo procesar la venta. Verifique el stock.', type: 'error' });
            }
        });
    }

    onCustomerSaveSuccess(): void {
        this.showCustomerModal.set(false);
        this.modalService.alert({ title: 'Éxito', message: 'Cliente guardado correctamente', type: 'success' });
        this.customerService.getAll().subscribe({
            next: (data) => { this.customers.set(data.data); }
        });
    }

}
