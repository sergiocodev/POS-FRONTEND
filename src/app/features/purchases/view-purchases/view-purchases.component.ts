import { Component, OnInit, inject, signal, computed, effect, untracked } from '@angular/core';
import { forkJoin } from 'rxjs';
import { take, finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { PurchaseService } from '../../../core/services/purchase.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { PurchaseResponse, PurchaseSummaryResponse } from '../../../core/models/purchase.model';
import { PurchaseListComponent } from './purchase-list/purchase-list.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { PurchaseDetailComponent } from './purchase-detail/purchase-detail.component';
import { SummaryCardsComponent, SummaryItem } from '../../../shared/components/summary-cards/summary-cards.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { DateRangeSearchComponent } from '../../../shared/components/date-range-search/date-range-search.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';

@Component({
    selector: 'app-view-purchases',
    standalone: true,
    imports: [
        CommonModule,
        PurchaseListComponent,
        ModalGenericComponent,
        PurchaseDetailComponent,
        ModuleHeaderComponent,
        SummaryCardsComponent,
        DateRangeSearchComponent,
        SpinnerComponent,
        ConfirmModalComponent,
        ModalAlertComponent
    ],
    templateUrl: './view-purchases.component.html'
})
export class ViewPurchasesComponent implements OnInit {
    private purchaseService = inject(PurchaseService);
    private establishmentStateService = inject(EstablishmentStateService);
    private modalService = inject(ModalService);

    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    // State
    purchases = signal<PurchaseResponse[]>([]);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');

    // Pagination & Filters
    currentPage = signal(0);
    pageSize = signal(10);
    totalItems = signal(0);
    totalPages = signal(0);

    startDate = signal<string>(this.formatDate(new Date()) + 'T00:00:00');
    endDate = signal<string>(this.formatDate(new Date()) + 'T23:59:59');
    tableFilters = signal<any>({});
    serverSummary = signal<PurchaseSummaryResponse | null>(null);

    // Modal State
    isDetailVisible = signal<boolean>(false);
    selectedPurchase = signal<PurchaseResponse | undefined>(undefined);

    summaryItems = computed<SummaryItem[]>(() => {
        const s = this.serverSummary();
        if (!s) return [
            { label: 'Total Facturas', value: 0, icon: 'bi-file-earmark-text', cssClass: 'card-f', isCurrency: true },
            { label: 'Total Boletas', value: 0, icon: 'bi-receipt', cssClass: 'card-b', isCurrency: true },
            { label: 'Guía Remisión', value: 0, icon: 'bi-truck', cssClass: 'card-c', isCurrency: true },
            { label: 'Total Neto', value: 0, icon: 'bi-cash-coin', cssClass: 'card-n', isCurrency: true },
        ];

        return [
            { label: 'Total Facturas', value: s.totalFacturas, icon: 'bi-file-earmark-text', cssClass: 'card-f', isCurrency: true },
            { label: 'Total Boletas', value: s.totalBoletas, icon: 'bi-receipt', cssClass: 'card-b', isCurrency: true },
            { label: 'Guía Remisión', value: s.totalGuiaRemision, icon: 'bi-truck', cssClass: 'card-c', isCurrency: true },
            { label: 'Total Neto', value: s.totalNeto, icon: 'bi-cash-coin', cssClass: 'card-n', isCurrency: true },
        ];
    });

    ngOnInit(): void {
        this.loadAllData();
    }

    constructor() {
        let isFirstRun = true;
        // React when establishment changes
        effect(() => {
            this.selectedEstablishmentId(); // track signal
            
            if (isFirstRun) {
                isFirstRun = false;
                return; // Let ngOnInit handle the initial data load
            }

            untracked(() => {
                this.currentPage.set(0);
                this.loadAllData();
            });
        }, { allowSignalWrites: true });
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadAllData(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');
        forkJoin({
            purchases: this.purchaseService.getAllPaged(this.currentPage(), this.pageSize(), this.startDate(), this.endDate(), this.tableFilters(), this.selectedEstablishmentId()).pipe(take(1)),
            summary: this.purchaseService.getSummary(this.startDate(), this.endDate(), this.tableFilters(), this.selectedEstablishmentId()).pipe(take(1))
        }).subscribe({
            next: (response) => {
                const page = response.purchases.data;
                this.purchases.set(page.content || []);
                this.totalItems.set(page.totalElements || 0);
                this.totalPages.set(page.totalPages || 0);
                this.serverSummary.set(response.summary.data);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('No se pudieron cargar los datos. Por favor, intente nuevamente.');
                this.isLoading.set(false);
                console.error('Error loading data:', error);
            }
        });
    }

    loadPurchases(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');
        this.purchaseService.getAllPaged(this.currentPage(), this.pageSize(), this.startDate(), this.endDate(), this.tableFilters(), this.selectedEstablishmentId())
        .pipe(take(1), finalize(() => this.isLoading.set(false)))
        .subscribe({
            next: (response) => {
                const page = response.data;
                this.purchases.set(page.content || []);
                this.totalItems.set(page.totalElements || 0);
                this.totalPages.set(page.totalPages || 0);
            },
            error: (error) => {
                this.errorMessage.set('No se pudieron cargar los datos. Por favor, intente nuevamente.');
                console.error('Error loading purchases:', error);
            }
        });
    }

    handlePageChange(page: number): void {
        this.currentPage.set(page);
        this.loadPurchases();
    }

    handlePageSizeChange(size: number): void {
        this.pageSize.set(size);
        this.currentPage.set(0);
        this.loadPurchases();
    }

    handleTableFilter(filters: any): void {
        this.tableFilters.set(filters);
        this.currentPage.set(0);
        this.loadAllData();
    }

    handleDateFilter(event: { startDate: string, endDate: string }) {
        this.startDate.set(event.startDate);
        this.endDate.set(event.endDate);
        this.currentPage.set(0);
        this.loadAllData();
    }

    onViewDetails(id: number): void {
        this.isDetailVisible.set(true);
        this.selectedPurchase.set(undefined);

        this.purchaseService.getById(id).subscribe({
            next: (response) => {
                this.selectedPurchase.set(response.data);
            },
            error: (error) => {
                console.error('Error fetching purchase details:', error);
                this.isDetailVisible.set(false);
                this.errorMessage.set('No se pudo obtener el detalle de la compra.');
            }
        });
    }

    onCancelPurchase(id: number): void {
        this.modalService.confirm({ title: 'Anular Compra', message: '¿Estás seguro de anular esta compra? Esta acción no se puede deshacer.' }).then((confirmed) => {
            if (confirmed) {
                this.isLoading.set(true);
                this.purchaseService.cancel(id).subscribe({
                    next: () => {
                        this.loadAllData();
                        this.modalService.alert({ title: 'Éxito', message: 'Compra anulada correctamente.', type: 'success' });
                    },
                    error: (err) => {
                        this.isLoading.set(false);
                        this.errorMessage.set('Error al anular la compra.');
                        this.modalService.alert({ title: 'Error', message: 'Error al anular la compra.', type: 'error' });
                        console.error(err);
                    }
                });
            }
        });
    }
}
