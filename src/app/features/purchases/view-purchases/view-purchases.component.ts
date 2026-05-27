import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseService } from '../../../core/services/purchase.service';
import { PurchaseResponse, PurchaseSummaryResponse } from '../../../core/models/purchase.model';
import { PurchaseListComponent } from './purchase-list/purchase-list.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { PurchaseDetailComponent } from './purchase-detail/purchase-detail.component';
import { SummaryCardsComponent, SummaryItem } from '../../../shared/components/summary-cards/summary-cards.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { DateRangeSearchComponent } from '../../../shared/components/date-range-search/date-range-search.component';

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
        DateRangeSearchComponent
    ],
    templateUrl: './view-purchases.component.html'
})
export class ViewPurchasesComponent implements OnInit {
    private purchaseService = inject(PurchaseService);

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
            { label: 'Total Facturas', value: 0, icon: 'F', cssClass: 'card-f' },
            { label: 'Total Boletas', value: 0, icon: 'B', cssClass: 'card-b' },
            { label: 'Guía Remisión', value: 0, icon: 'G', cssClass: 'card-c' },
            { label: 'Total Neto', value: 0, icon: 'N', cssClass: 'card-n' },
        ];

        return [
            { label: 'Total Facturas', value: s.totalFacturas, icon: 'F', cssClass: 'card-f' },
            { label: 'Total Boletas', value: s.totalBoletas, icon: 'B', cssClass: 'card-b' },
            { label: 'Guía Remisión', value: s.totalGuiaRemision, icon: 'G', cssClass: 'card-c' },
            { label: 'Total Neto', value: s.totalNeto, icon: 'N', cssClass: 'card-n', isCurrency: true },
        ];
    });

    ngOnInit(): void {
        this.loadPurchases();
        this.loadSummary();
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadPurchases(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.purchaseService.getAllPaged(this.currentPage(), this.pageSize(), this.startDate(), this.endDate(), this.tableFilters()).subscribe({
            next: (response) => {
                const page = response.data;
                this.purchases.set(page.content || []);
                this.totalItems.set(page.totalElements || 0);
                this.totalPages.set(page.totalPages || 0);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('No se pudieron cargar los datos. Por favor, intente nuevamente.');
                this.isLoading.set(false);
                console.error('Error loading purchases:', error);
            }
        });
    }

    loadSummary(): void {
        this.purchaseService.getSummary(this.startDate(), this.endDate(), this.tableFilters()).subscribe({
            next: (response) => {
                this.serverSummary.set(response.data);
            },
            error: (err) => console.error('Error loading summary:', err)
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
        this.loadPurchases();
        this.loadSummary();
    }

    handleDateFilter(event: { startDate: string, endDate: string }) {
        this.startDate.set(event.startDate);
        this.endDate.set(event.endDate);
        this.currentPage.set(0);
        this.loadPurchases();
        this.loadSummary();
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
        if (confirm('¿Estás seguro de anular esta compra? Esta acción no se puede deshacer.')) {
            this.purchaseService.cancel(id).subscribe({
                next: () => {
                    this.loadPurchases();
                    this.loadSummary();
                },
                error: (err) => {
                    this.errorMessage.set('Error al anular la compra.');
                    console.error(err);
                }
            });
        }
    }
}
