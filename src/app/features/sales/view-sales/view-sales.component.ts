import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SaleService } from '../../../core/services/sale.service';
import { SaleResponse, SaleSummaryResponse } from '../../../core/models/sale.model';
import { SaleListComponent } from './sale-list/sale-list.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { SaleDetailComponent } from './sale-detail/sale-detail.component';
import { SummaryItem } from '../../../shared/components/summary-cards/summary-cards.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
@Component({
    selector: 'app-view-sales',
    standalone: true,
    imports: [
        CommonModule,
        SaleListComponent,
        ModalGenericComponent,
        SaleDetailComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './view-sales.component.html'
})
export class ViewSalesComponent implements OnInit {
    private saleService = inject(SaleService);
    private router = inject(Router);

    // State
    sales = signal<SaleResponse[]>([]);
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
    serverSummary = signal<SaleSummaryResponse | null>(null);

    // Modal State
    isDetailVisible = signal<boolean>(false);
    selectedSale = signal<SaleResponse | undefined>(undefined);

    summaryItems = computed<SummaryItem[]>(() => {
        const s = this.serverSummary();
        if (!s) return [
            { label: 'Total Facturas', value: 0, icon: 'F', cssClass: 'card-f' },
            { label: 'Total Boletas', value: 0, icon: 'B', cssClass: 'card-b' },
            { label: 'Nota de Crédito', value: 0, icon: 'C', cssClass: 'card-c' },
            { label: 'Nota de Débito', value: 0, icon: 'D', cssClass: 'card-d' },
            { label: 'Nota de Venta', value: 0, icon: 'V', cssClass: 'card-v' },
            { label: 'Total Neto', value: 0, icon: 'N', cssClass: 'card-n' },
        ];

        return [
            { label: 'Total Facturas', value: s.totalFacturas, icon: 'F', cssClass: 'card-f' },
            { label: 'Total Boletas', value: s.totalBoletas, icon: 'B', cssClass: 'card-b' },
            { label: 'Nota de Crédito', value: s.totalNotaCredito, icon: 'C', cssClass: 'card-c' },
            { label: 'Nota de Débito', value: s.totalNotaDebito, icon: 'D', cssClass: 'card-d' },
            { label: 'Nota de Venta', value: s.totalNotaVenta, icon: 'V', cssClass: 'card-v' },
            { label: 'Total Neto', value: s.totalNeto, icon: 'N', cssClass: 'card-n' },
        ];
    });

    ngOnInit(): void {
        this.loadSales();
        this.loadSummary();
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadSales(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.saleService.getAllPaged(this.currentPage(), this.pageSize(), this.startDate(), this.endDate(), this.tableFilters()).subscribe({
            next: (response) => {
                const page = response.data;
                this.sales.set(page.content || []);
                this.totalItems.set(page.totalElements || 0);
                this.totalPages.set(page.totalPages || 0);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('No se pudieron cargar los datos. Por favor, intente nuevamente.');
                this.isLoading.set(false);
                console.error('Error loading sales:', error);
            }
        });
    }

    loadSummary(): void {
        this.saleService.getSummary(this.startDate(), this.endDate(), this.tableFilters()).subscribe({
            next: (response) => {
                this.serverSummary.set(response.data);
            },
            error: (err) => console.error('Error loading summary:', err)
        });
    }

    handlePageChange(page: number): void {
        this.currentPage.set(page);
        this.loadSales();
    }

    handlePageSizeChange(size: number): void {
        this.pageSize.set(size);
        this.currentPage.set(0);
        this.loadSales();
    }

    handleTableFilter(filters: any): void {
        this.tableFilters.set(filters);
        this.currentPage.set(0);
        this.loadSales();
        this.loadSummary();
    }

    handleDateFilter(event: { startDate: string, endDate: string }) {
        this.startDate.set(event.startDate);
        this.endDate.set(event.endDate);
        this.currentPage.set(0);
        this.loadSales();
        this.loadSummary();
    }

    onViewDetails(id: number): void {
        this.isDetailVisible.set(true);
        this.selectedSale.set(undefined);

        this.saleService.getById(id).subscribe({
            next: (response) => {
                this.selectedSale.set(response.data);
            },
            error: (error) => {
                console.error('Error fetching sale details:', error);
                this.isDetailVisible.set(false);
                this.errorMessage.set('No se pudo obtener el detalle de la venta.');
            }
        });
    }

    onCancelSale(id: number): void {
        if (confirm('¿Estás seguro de anular esta venta? Esta acción no se puede deshacer.')) {
            this.saleService.cancel(id).subscribe({
                next: () => {
                    this.loadSales();
                    this.loadSummary();
                },
                error: (err) => {
                    this.errorMessage.set('Error al anular la venta.');
                    console.error(err);
                }
            });
        }
    }
}
