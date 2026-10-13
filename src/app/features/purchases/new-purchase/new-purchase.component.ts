import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { toObservable, toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { forkJoin, Subject, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, catchError, finalize, tap } from 'rxjs/operators';

// Services
import { PurchaseService } from '../../../core/services/purchase.service';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { AuthService } from '../../../core/services/auth.service';

// Models
import { SupplierResponse } from '../../../core/models/supplier.model';
import { ProductResponse } from '../../../core/models/product.model';
import { PurchaseRequest } from '../../../core/models/purchase.model';
import { PurchaseCartItem } from './purchase-cart.model';

// Components
import { PurchaseProductCatalogPanelComponent } from './purchase-product-catalog-panel/purchase-product-catalog-panel.component';
import { PurchaseCheckoutPanelComponent } from './purchase-checkout-panel/purchase-checkout-panel.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { SupplierFormComponent } from '../suppliers/supplier-form/supplier-form.component';

const PAGE_SIZE = 48;
const DEBOUNCE_TIME_MS = 300;

@Component({
    selector: 'app-new-purchase',
    standalone: true,
    imports: [
        PurchaseProductCatalogPanelComponent,
        PurchaseCheckoutPanelComponent,
        ModuleHeaderComponent,
        SpinnerComponent,
        ConfirmModalComponent,
        ModalAlertComponent,
        ModalGenericComponent,
        SupplierFormComponent
    ],
    templateUrl: './new-purchase.component.html',
    styleUrl: './new-purchase.component.scss'
})
export class NewPurchaseComponent {
    private purchaseService = inject(PurchaseService);
    private productService = inject(ProductService);
    private supplierService = inject(SupplierService);
    private establishmentStateService = inject(EstablishmentStateService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private modalService = inject(ModalService);
    private destroyRef = inject(DestroyRef);

    isLoading = signal(false);

    private establishmentId$ = toObservable(this.establishmentStateService.selectedEstablishmentId);

    private initialData = toSignal(
        this.establishmentId$.pipe(
            tap(() => this.isLoading.set(true)),
            switchMap(id => {
                if (!id) return of(null);
                return forkJoin({
                    products: this.productService.getPaged(0, PAGE_SIZE),
                    suppliers: this.supplierService.getAll()
                }).pipe(
                    catchError(err => {
                        console.error('Error loading initial data', err);
                        this.modalService.alert({ title: 'Error', message: 'Error al cargar datos iniciales', type: 'error' });
                        return of(null);
                    })
                );
            }),
            tap(() => this.isLoading.set(false))
        )
    );

    products = computed(() => this.initialData()?.products?.data?.content ?? []);
    suppliers = computed(() => this.initialData()?.suppliers?.data ?? []);
    displayProducts = computed(() => this.products());

    // Search Logic
    private searchSubject = new Subject<string>();
    private searchResults = toSignal(
        this.searchSubject.pipe(
            takeUntilDestroyed(this.destroyRef),
            debounceTime(DEBOUNCE_TIME_MS),
            distinctUntilChanged(),
            switchMap(term => {
                const normalizedTerm = term.trim();
                if (!normalizedTerm) {
                    return of(null);
                }
                return this.productService.search(normalizedTerm).pipe(
                    map(response => response.data),
                    catchError(err => {
                        console.error('Error searching products', err);
                        return of(null);
                    })
                );
            })
        )
    );

    filteredProducts = computed(() => this.searchResults() ?? this.displayProducts());

    cart = signal<PurchaseCartItem[]>([]);
    isCartOpen = signal<boolean>(false);

    onProductSearch(term: string): void {
        this.searchSubject.next(term);
    }

    onProcessPurchase(request: PurchaseRequest): void {
        const estId = this.establishmentStateService.getSelectedEstablishment();
        if (!estId) {
            this.modalService.alert({ title: 'Error', message: 'Seleccione un establecimiento', type: 'error' });
            return;
        }

        const userId = this.authService.currentUser()?.id || 1;
        request.establishmentId = estId;

        this.isLoading.set(true);
        this.purchaseService.create(request, userId).pipe(
            finalize(() => this.isLoading.set(false))
        ).subscribe({
            next: (res) => {
                this.modalService.alert({
                    title: 'Éxito',
                    message: `Compra registrada!<br>${res.data.series || ''}-${res.data.number || ''}`,
                    type: 'success'
                }).then(() => {
                    this.cart.set([]);
                    this.router.navigate(['/purchases']);
                });
            },
            error: (err) => {
                console.error('Error processing purchase', err);
                const msg = err.error?.message || 'Ocurrió un error al registrar la compra.';
                this.modalService.alert({ title: 'Error', message: msg, type: 'error' });
            }
        });
    }

    // Modal state for Suppliers
    showSupplierModal = signal(false);
    selectedSupplierIdToEdit = signal<number | null>(null);
    preselectedSupplierId = signal<number | null>(null);

    openSupplierModal(id?: number): void {
        this.selectedSupplierIdToEdit.set(id || null);
        this.showSupplierModal.set(true);
    }

    closeSupplierModal(): void {
        this.showSupplierModal.set(false);
        this.selectedSupplierIdToEdit.set(null);
    }

    onSupplierSaveSuccess(newSupplierId: number): void {
        this.showSupplierModal.set(false);
        this.modalService.alert({ title: 'Éxito', message: 'Proveedor guardado correctamente', type: 'success' });
        if (newSupplierId) {
            this.preselectedSupplierId.set(newSupplierId);
        }
    }
}
