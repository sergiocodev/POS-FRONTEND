import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';
import { RouterModule, Router } from '@angular/router';
import { SaleService } from '../../../../core/services/sale.service';
import { SaleResponse, SaleDocumentType, SaleStatus } from '../../../../core/models/sale.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { TemplateRef, ViewChild } from '@angular/core';

import { SummaryCardsComponent, SummaryItem } from '../../../../shared/components/summary-cards/summary-cards.component';
import { DateRangeSearchComponent } from '../../../../shared/components/date-range-search/date-range-search.component';
import { ModalGenericComponent } from '../../../../shared/components/modal-generic/modal-generic.component';
import { SaleDetailComponent } from '../sale-detail/sale-detail.component';

@Component({
    selector: 'app-sale-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ModuleHeaderComponent,
        FormsModule,
        SummaryCardsComponent,
        CustomTableComponent,
        DateRangeSearchComponent,
        ModalGenericComponent,
        SaleDetailComponent
    ],
    templateUrl: './sale-list.component.html',
    styleUrl: './sale-list.component.scss'
})
export class SaleListComponent implements OnInit {
    @ViewChild('dateTemplate', { static: true }) dateTemplate!: TemplateRef<any>;
    @ViewChild('customerNameTemplate', { static: true }) customerNameTemplate!: TemplateRef<any>;
    @ViewChild('voucherTemplate', { static: true }) voucherTemplate!: TemplateRef<any>;
    @ViewChild('paymentConditionTemplate', { static: true }) paymentConditionTemplate!: TemplateRef<any>;
    @ViewChild('totalTemplate', { static: true }) totalTemplate!: TemplateRef<any>;
    @ViewChild('statusBadgeTemplate', { static: true }) statusBadgeTemplate!: TemplateRef<any>;
    @ViewChild('sunatBadgeTemplate', { static: true }) sunatBadgeTemplate!: TemplateRef<any>;
    @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;

    private saleService = inject(SaleService);
    private router = inject(Router);

    // Pagination state
    currentPage = signal(0);
    pageSize = signal(20);
    totalItems = signal(0);
    totalPages = signal(0);

    sales = signal<SaleResponse[]>([]);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');

    // Filters
    startDate = signal<string>(this.formatDate(new Date()) + 'T00:00:00');
    endDate = signal<string>(this.formatDate(new Date()) + 'T23:59:59');

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Modal State
    isDetailVisible = signal<boolean>(false);
    selectedSale = signal<SaleResponse | undefined>(undefined);

    // Document Types for the UI
    SaleDocumentType = SaleDocumentType;

    columns: TableColumn[] = [];

    summary = computed(() => {
        const sales = this.sales();
        return {
            totalFacturas: sales.filter(s => s.documentType === SaleDocumentType.FACTURA).reduce((acc, s) => acc + s.total, 0),
            totalBoletas: sales.filter(s => s.documentType === SaleDocumentType.BOLETA).reduce((acc, s) => acc + s.total, 0),
            totalNotaCredito: sales.filter(s => s.documentType === SaleDocumentType.NOTA_CREDITO).reduce((acc, s) => acc + s.total, 0),
            totalNotaDebito: sales.filter(s => s.documentType === SaleDocumentType.NOTA_DEBITO).reduce((acc, s) => acc + s.total, 0),
            totalNotaVenta: sales.filter(s => s.documentType === SaleDocumentType.NOTA_DE_VENTA).reduce((acc, s) => acc + s.total, 0),
            totalNeto: sales.reduce((acc, s) => acc + s.total, 0)
        };
    });

    summaryItems = computed<SummaryItem[]>(() => {
        const s = this.summary();
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
        this.setupColumns();
    }

    setupColumns() {
        this.columns = [
            { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
            {
                key: 'date',
                label: 'Fecha',
                type: 'template',
                filterable: true,
                templateRef: this.dateTemplate,
                align: 'center'
            },
            {
                key: 'documentType',
                label: 'Tipo Doc.',
                filterable: true,
                align: 'center'
            },
            {
                key: 'voucher',
                label: 'Comprobante',
                type: 'template',
                filterable: true,
                templateRef: this.voucherTemplate,
                align: 'center'
            },
            {
                key: 'customerName',
                label: 'Cliente',
                type: 'template',
                filterable: true,
                templateRef: this.customerNameTemplate,
                align: 'center'
            },
            {
                key: 'userFullName',
                label: 'Vendedor',
                filterable: true,
                format: (val: any, row: any) => row.userFullName || row.username,
                align: 'center'
            },
            {
                key: 'total',
                label: 'Total',
                type: 'template',
                filterable: true,
                templateRef: this.totalTemplate,
                align: 'center'
            },
            {
                key: 'payments',
                label: 'Modo de pago',
                type: 'template',
                filterable: true,
                templateRef: this.paymentConditionTemplate,
                //format: (val: any) => val[0]?.paymentMethod || 'Contado',
                align: 'center'
            },
            {
                key: 'status',
                label: 'Estado',
                type: 'template',
                filterable: true,
                templateRef: this.statusBadgeTemplate,
                align: 'center'
            },
            {
                key: 'sunatStatus',
                label: 'Transmitido',
                type: 'template',
                filterable: true,
                templateRef: this.sunatBadgeTemplate,
                align: 'center'
            },
            {
                key: 'actions',
                label: 'Acciones',
                type: 'template',
                templateRef: this.actionsTemplate,
                align: 'center'
            }
        ];
    }

    loadSales(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.saleService.getAllPaged(this.currentPage(), this.pageSize(), this.startDate(), this.endDate()).subscribe({
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

    // Pagination controls
    goToPage(page: number): void {
        if (page >= 0 && page < this.totalPages()) {
            this.currentPage.set(page);
            this.loadSales();
        }
    }

    previousPage(): void {
        if (this.currentPage() > 0) {
            this.currentPage.set(this.currentPage() - 1);
            this.loadSales();
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages() - 1) {
            this.currentPage.set(this.currentPage() + 1);
            this.loadSales();
        }
    }

    get displayStart(): number {
        return this.totalItems() === 0 ? 0 : (this.currentPage() * this.pageSize()) + 1;
    }

    get displayEnd(): number {
        const end = (this.currentPage() + 1) * this.pageSize();
        return Math.min(end, this.totalItems());
    }

    get pageNumbers(): number[] {
        const total = this.totalPages();
        const current = this.currentPage();
        const pages: number[] = [];

        if (total <= 7) {
            for (let i = 0; i < total; i++) pages.push(i);
        } else {
            pages.push(0, 1, 2);
            if (current > 4) pages.push(-1); // ellipsis
            const start = Math.max(3, current - 1);
            const end = Math.min(total - 3, current + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (current < total - 5) pages.push(-2); // ellipsis
            pages.push(total - 3, total - 2, total - 1);
        }

        return pages;
    }

    onPageClick(page: number): void {
        if (page < 0) return; // ellipsis
        this.goToPage(page);
    }

    isEllipsis(page: number): boolean {
        return page < 0;
    }

    onNewSale(): void {
        this.router.navigate(['/sales/pos']);
    }

    onViewDetails(id: number): void {
        this.isDetailVisible.set(true);
        this.selectedSale.set(undefined); // Reset previous sale

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

    handleTableAction(event: { action: string, row: SaleResponse }) {
        if (event.action === 'view') {
            this.onViewDetails(event.row.id);
        } else if (event.action === 'cancel') {
            this.onCancel(event.row.id);
        }
    }

    onCancel(id: number): void {
        if (confirm('¿Estás seguro de anular esta venta? Esta acción no se puede deshacer.')) {
            this.saleService.cancel(id).subscribe({
                next: () => {
                    this.loadSales(); // Reload to see status change
                },
                error: (err) => {
                    this.errorMessage.set('Error al anular la venta.');
                    console.error(err);
                }
            });
        }
    }

    handleFilter(event: { startDate: string, endDate: string }) {
        this.startDate.set(event.startDate);
        this.endDate.set(event.endDate);
        this.currentPage.set(0);
        this.loadSales();
    }

    // --- Helpers for UI Classes ---

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'bg-success-subtle text-success border border-success-subtle';
            case 'CANCELED':
            case 'VOIDED': return 'bg-danger-subtle text-danger border border-danger-subtle';
            default: return 'bg-secondary-subtle text-secondary';
        }
    }

    getSunatBadgeClass(status: string): string {
        switch (status) {
            case 'ACCEPTED': return 'bg-success';
            case 'PENDING': return 'bg-warning text-dark';
            case 'REJECTED': return 'bg-danger';
            default: return 'bg-info text-dark';
        }
    }

    getPaymentConditionBadgeClass(condition: string): string {
        switch (condition) {
            case 'CASH':
            case 'CONTADO': return 'bg-info text-dark';
            case 'CREDIT':
            case 'CREDITO': return 'bg-warning text-dark';
            default: return 'bg-secondary';
        }
    }

    trackById(index: number, item: SaleResponse): number {
        return item.id;
    }
}