import { Component, OnInit, inject, signal, effect, untracked, DestroyRef, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { forkJoin, Subject, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, catchError, finalize, tap } from 'rxjs/operators';

// Services & Models
import { SaleService } from '../../../core/services/sale.service';
import { SaleLogicService } from '../../../core/services/sale-logic.service';
import { CustomerService } from '../../../core/services/customer.service';
import { CashSessionService } from '../../../core/services/cash-session.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { CustomerResponse } from '../../../core/models/customer.model';
import { CashSessionResponse } from '../../../core/models/cash.model';
import { SaleRequest, ProductForSaleResponse, SaleFormData, CartItem } from '../../../core/models/sale.model';

// Components
import { ProductCatalogPanelComponent } from './product-catalog-panel/product-catalog-panel.component';
import { CheckoutPanelComponent } from './checkout-panel/checkout-panel.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { CustomerFormComponent } from '../customers/customer-form/customer-form.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CashOpenComponent } from '../../box/opening-closing/box-details/cash-open/cash-open.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';

@Component({
    selector: 'app-new-sale',
    standalone: true,
    imports: [
        ProductCatalogPanelComponent,
        CheckoutPanelComponent,
        ModalGenericComponent,
        CustomerFormComponent,
        ModuleHeaderComponent,
        SpinnerComponent,
        CashOpenComponent,
        ConfirmModalComponent,
        ModalAlertComponent
    ],
    templateUrl: './new-sale.component.html',
    styleUrl: './new-sale.component.scss'
})
export class NewSaleComponent implements OnInit {
    private saleService = inject(SaleService);
    private saleLogicService = inject(SaleLogicService);
    private customerService = inject(CustomerService);
    private cashSessionService = inject(CashSessionService);
    private establishmentStateService = inject(EstablishmentStateService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);
    private modalService = inject(ModalService);

    isLoading = signal(false);
    
    private establishmentId$ = toObservable(this.establishmentStateService.selectedEstablishmentId);

    private posData = toSignal(
        this.establishmentId$.pipe(
            tap(() => this.isLoading.set(true)),
            switchMap(id => {
                if (!id) return of(null);
                return forkJoin({
                    products: this.saleService.listProductsForSale(id),
                    customers: this.customerService.getAll(),
                    activeSession: this.cashSessionService.getActiveSession().pipe(
                        catchError(() => of(null))
                    )
                });
            }),
            tap(() => this.isLoading.set(false))
        )
    );

    // State Signals derived from posData
    products = computed(() => this.posData()?.products?.data ?? []);
    customers = computed(() => this.posData()?.customers?.data ?? []);
    activeSession = computed(() => this.posData()?.activeSession?.data ?? null);
    displayProducts = computed(() => this.saleLogicService.deduplicateProductsForGrid(this.products()));

    // Search Logic
    private searchSubject = new Subject<string>();
    private searchResults = toSignal(
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => {
                const estId = this.establishmentStateService.getSelectedEstablishment();
                if (!term.trim() || !estId) {
                    return of(null); // Use null to signify we should use displayProducts
                }
                return this.saleService.searchProductsForPOS(term.trim(), estId).pipe(
                    map(response => this.saleLogicService.deduplicateProductsForGrid(response.data))
                );
            })
        )
    );
    
    filteredProducts = computed(() => this.searchResults() ?? this.displayProducts());

    // Cart Signals
    cart = signal<CartItem[]>([]);
    selectedCustomer = signal<CustomerResponse | null>(null);

    // UI/Modal State
    showCustomerModal = signal<boolean>(false);
    showOpenModal = signal<boolean>(false);
    isCartOpen = signal<boolean>(false);
    preselectedCustomerId = signal<number | null>(null);

    constructor() {
        // Effect to handle missing cash session
        effect(() => {
            const data = this.posData();
            if (data === undefined) return; // Initial loading state

            const session = this.activeSession();
            if (data && (!session || session.status !== 'OPEN')) {
                untracked(() => {
                    this.modalService.alert({
                        title: 'Error',
                        message: 'Debe abrir una caja antes de realizar ventas',
                        type: 'warning',
                        buttonText: 'Ok'
                    }).then(() => {
                        this.showOpenModal.set(true);
                    });
                });
            }
        });

        // Effect to set default customer
        effect(() => {
            if (this.posData() && !this.selectedCustomer()) {
                const defaultCust = this.customers().find(c => c.documentNumber === '00000000');
                if (defaultCust) {
                    this.selectedCustomer.set(defaultCust);
                }
            }
        });
    }

    ngOnInit(): void {}

    onOpenSaved(): void {
        this.showOpenModal.set(false);
        this.refreshData();
    }

    onOpenCanceled(): void {
        this.showOpenModal.set(false);
        this.router.navigate(['/home']);
    }

    onProductSearch(term: string): void {
        this.searchSubject.next(term);
    }

    onProcessSale(saleData: SaleFormData): void {
        const establishmentId = this.establishmentStateService.getSelectedEstablishment();
        if (!establishmentId || !this.activeSession()) {
            this.modalService.alert({ title: 'Error', message: 'No hay un establecimiento o sesión de caja activa.', type: 'error' });
            return;
        }

        this.isLoading.set(true);
        const request: SaleRequest = {
            establishmentId: establishmentId,
            cashSessionId: this.activeSession()!.id,
            customerId: saleData.customer?.id,
            documentType: saleData.documentType,
            series: saleData.series,
            items: saleData.items.map((item) => ({
                productId: item.product.productId,
                productUnitId: item.product.productUnitId,
                lotId: item.product.lotId,
                quantity: item.quantity,
                unitPrice: item.price,
                discountAmount: (item.adjustment ?? 0) < 0 ? Math.abs(item.adjustment!) : 0,
                discountReason: (item.adjustment ?? 0) < 0 ? 'Ajuste POS (Dscto)' : undefined,
                increaseAmount: (item.adjustment ?? 0) > 0 ? item.adjustment! : 0,
                increaseReason: (item.adjustment ?? 0) > 0 ? 'Ajuste POS (Aumento)' : undefined
            })),
            payments: saleData.payments.map((p) => ({
                ...p,
                cashSessionId: this.activeSession()!.id
            })),
            paymentCondition: saleData.paymentCondition,
            dueDate: saleData.dueDate
        };

        this.saleService.create(request).pipe(
            finalize(() => this.isLoading.set(false))
        ).subscribe({
            next: (response) => {
                this.modalService.alert({ title: 'Éxito', message: `Venta registrada!<br>${response.data.series}-${response.data.number}`, type: 'success' });
                this.cart.set([]);
            },
            error: (err) => {
                console.error('Sale error:', err);
                this.modalService.alert({ title: 'Error', message: 'No se pudo procesar la venta. Verifique el stock.', type: 'error' });
            }
        });
    }

    onCustomerSaveSuccess(newCustomerId: number): void {
        this.showCustomerModal.set(false);
        this.modalService.alert({ title: 'Éxito', message: 'Cliente guardado correctamente', type: 'success' });
        if (newCustomerId) {
            this.preselectedCustomerId.set(newCustomerId);
        }
        this.customerService.invalidateCache();
        this.refreshData();
    }
    
    private refreshData(): void {
        const currentId = this.establishmentStateService.getSelectedEstablishment();
        this.establishmentStateService.selectEstablishment(null);
        setTimeout(() => this.establishmentStateService.selectEstablishment(currentId), 0);
    }
}
